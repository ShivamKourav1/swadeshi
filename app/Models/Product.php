<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'dealer_id',
        'category_id',
        'name',
        'slug',
        'sku',
        'description',
        'price',
        'stock',
        'image_url',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
    ];

    protected $appends = [
        'dealer_unit_info',
    ];

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dealer_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Case-insensitive search across product details, dealer name, and dealer unit names.
     */
    public function scopeSearch($query, ?string $term)
    {
        if (!$term) {
            return $query;
        }

        $rawTerm = '%' . mb_strtolower(trim($term)) . '%';
        $cleanTerm = trim(preg_replace('/\b(nagar|jila|zila|shakha|vibhag|prant|kshetra|toli)\b/i', '', $term));
        $cleanTermWildcard = '%' . mb_strtolower($cleanTerm) . '%';

        return $query->where(function ($q) use ($rawTerm, $cleanTermWildcard, $cleanTerm) {
            $q->whereRaw('LOWER(name) LIKE ?', [$rawTerm])
              ->orWhereRaw('LOWER(description) LIKE ?', [$rawTerm])
              ->orWhereRaw('LOWER(sku) LIKE ?', [$rawTerm])
              ->orWhereHas('dealer', function ($dq) use ($rawTerm, $cleanTermWildcard, $cleanTerm) {
                  $dq->whereRaw('LOWER(name) LIKE ?', [$rawTerm])
                     ->orWhereHas('profile', function ($pq) use ($rawTerm, $cleanTermWildcard, $cleanTerm) {
                         $pq->whereRaw('LOWER(business_name) LIKE ?', [$rawTerm]);

                         if (strlen($cleanTerm) >= 2) {
                             $pq->orWhereHas('nagar', fn($nq) => $nq->whereRaw('LOWER(nagar_name) LIKE ?', [$cleanTermWildcard]))
                                ->orWhereHas('jila', fn($jq) => $jq->whereRaw('LOWER(jila_name) LIKE ?', [$cleanTermWildcard]))
                                ->orWhereHas('shakha', fn($sq) => $sq->whereRaw('LOWER(shakha_name) LIKE ?', [$cleanTermWildcard]))
                                ->orWhereHas('shakha.nagar', fn($nq) => $nq->whereRaw('LOWER(nagar_name) LIKE ?', [$cleanTermWildcard]))
                                ->orWhereHas('nagar.jila', fn($jq) => $jq->whereRaw('LOWER(jila_name) LIKE ?', [$cleanTermWildcard]));
                         } else {
                             $pq->orWhereHas('nagar', fn($nq) => $nq->whereRaw('LOWER(nagar_name) LIKE ?', [$rawTerm]))
                                ->orWhereHas('jila', fn($jq) => $jq->whereRaw('LOWER(jila_name) LIKE ?', [$rawTerm]))
                                ->orWhereHas('shakha', fn($sq) => $sq->whereRaw('LOWER(shakha_name) LIKE ?', [$rawTerm]));
                         }
                     });
              });
        });
    }

    /**
     * Filter products by organizational unit (Shakha, Nagar, Jila, Vibhag, Prant, Kshetra).
     */
    public function scopeByOrgUnit($query, ?string $unitType = null, $unitId = null, ?string $unitSearch = null, bool $onlyKaryakarta = false)
    {
        if ($onlyKaryakarta) {
            $query->whereHas('dealer', function ($dq) {
                $dq->where('role', 'karyakarta')
                   ->orWhereHas('roles', fn($rq) => $rq->whereIn('roles.name', [
                       'karyakarta',
                       'nagar_karyakarta',
                       'jila_karyakarta',
                       'shakha_karyakarta',
                       'vibhag_karyakarta',
                       'kshetra_karyakarta',
                       'prant_karyakarta'
                   ]));
            });
        }

        if ($unitType && $unitId) {
            return $query->whereHas('dealer.profile', function ($pq) use ($unitType, $unitId) {
                if ($unitType === 'shakha') {
                    $pq->where('shakha_id', $unitId);
                } elseif ($unitType === 'nagar') {
                    $pq->where('nagar_id', $unitId)
                       ->orWhereHas('shakha', fn($sq) => $sq->where('nagar_id', $unitId));
                } elseif ($unitType === 'jila') {
                    $pq->where('jila_id', $unitId)
                       ->orWhereHas('nagar', fn($nq) => $nq->where('jila_id', $unitId))
                       ->orWhereHas('shakha.nagar', fn($nq) => $nq->where('jila_id', $unitId));
                } elseif ($unitType === 'vibhag') {
                    $pq->where('vibhag_id', $unitId)
                       ->orWhereHas('jila', fn($jq) => $jq->where('vibhag_id', $unitId))
                       ->orWhereHas('nagar.jila', fn($jq) => $jq->where('vibhag_id', $unitId));
                } elseif ($unitType === 'prant') {
                    $pq->where('prant_id', $unitId)
                       ->orWhereHas('vibhag', fn($vq) => $vq->where('prant_id', $unitId));
                } elseif ($unitType === 'kshetra') {
                    $pq->where('kshetra_id', $unitId)
                       ->orWhereHas('prant', fn($prq) => $prq->where('kshetra_id', $unitId));
                }
            });
        }

        if ($unitSearch) {
            $cleanSearch = trim(preg_replace('/\b(nagar|jila|zila|shakha|vibhag|prant|kshetra|toli)\b/i', '', $unitSearch));
            $terms = array_filter(array_unique([
                '%' . mb_strtolower(trim($unitSearch)) . '%',
                '%' . mb_strtolower($cleanSearch) . '%',
            ]), fn($t) => strlen(str_replace('%', '', $t)) >= 2);

            if (empty($terms)) {
                $terms = ['%' . mb_strtolower(trim($unitSearch)) . '%'];
            }

            return $query->where(function ($q) use ($terms) {
                foreach ($terms as $term) {
                    $q->orWhereHas('dealer.profile', function ($pq) use ($term) {
                        $pq->whereHas('nagar', fn($nq) => $nq->whereRaw('LOWER(nagar_name) LIKE ?', [$term]))
                           ->orWhereHas('jila', fn($jq) => $jq->whereRaw('LOWER(jila_name) LIKE ?', [$term]))
                           ->orWhereHas('shakha', fn($sq) => $sq->whereRaw('LOWER(shakha_name) LIKE ?', [$term]))
                           ->orWhereHas('shakha.nagar', fn($nq) => $nq->whereRaw('LOWER(nagar_name) LIKE ?', [$term]))
                           ->orWhereHas('nagar.jila', fn($jq) => $jq->whereRaw('LOWER(jila_name) LIKE ?', [$term]));
                    });
                }
            });
        }

        return $query;
    }

    public function scopeByCategory($query, $categoryId)
    {
        if (!$categoryId) {
            return $query;
        }

        return $query->where('category_id', $categoryId);
    }

    /**
     * Computed attribute to provide dealer, toli, and organizational unit context.
     */
    public function getDealerUnitInfoAttribute(): ?array
    {
        if (!$this->dealer) {
            return null;
        }

        $dealer = $this->dealer;
        $profile = $dealer->profile;
        $isKaryakarta = $dealer->isKaryakarta();

        $unitType = null;
        $unitName = null;
        $toliBadge = null;
        $fullLocation = [];

        if ($profile) {
            if ($profile->shakha_id && $profile->shakha) {
                $unitType = 'shakha';
                $unitName = $profile->shakha->shakha_name;
                if ($profile->is_shakha_toli_member) {
                    $toliBadge = "Shakha Toli ({$unitName})";
                }
                $fullLocation[] = $unitName;
            }

            if ($profile->nagar_id && $profile->nagar) {
                if (!$unitType) {
                    $unitType = 'nagar';
                    $unitName = $profile->nagar->nagar_name . ' Nagar';
                }
                if ($profile->is_nagar_toli_member && !$toliBadge) {
                    $toliBadge = "Nagar Toli ({$profile->nagar->nagar_name})";
                }
                $fullLocation[] = $profile->nagar->nagar_name . ' Nagar';
            }

            if ($profile->jila_id && $profile->jila) {
                if (!$unitType) {
                    $unitType = 'jila';
                    $unitName = $profile->jila->jila_name . ' Jila';
                }
                if ($profile->is_jila_toli_member && !$toliBadge) {
                    $toliBadge = "Jila Toli ({$profile->jila->jila_name})";
                }
                $fullLocation[] = $profile->jila->jila_name . ' Jila';
            }

            if ($profile->vibhag_id && $profile->vibhag) {
                if (!$unitType) {
                    $unitType = 'vibhag';
                    $unitName = $profile->vibhag->vibhag_name . ' Vibhag';
                }
                if ($profile->is_vibhag_toli_member && !$toliBadge) {
                    $toliBadge = "Vibhag Toli ({$profile->vibhag->vibhag_name})";
                }
                $fullLocation[] = $profile->vibhag->vibhag_name . ' Vibhag';
            }
        }

        if (!$toliBadge && $isKaryakarta) {
            $toliBadge = 'Karyakarta Dealer';
        }

        return [
            'dealer_id' => $dealer->id,
            'dealer_name' => $dealer->name,
            'business_name' => $profile?->business_name,
            'is_karyakarta' => $isKaryakarta,
            'unit_type' => $unitType,
            'unit_name' => $unitName,
            'toli_badge' => $toliBadge,
            'location_summary' => !empty($fullLocation) ? implode(', ', $fullLocation) : null,
        ];
    }
}
