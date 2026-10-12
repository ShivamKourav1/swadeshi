<?php

namespace App\Http\Controllers\Karyakarta;

use App\Http\Controllers\Controller;
use App\Models\Daayitwa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DaayitwaController extends Controller
{
    /**
     * Display all Daayitwa responsibilities. Available only to superadmin.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (!$user || !$user->isSuperAdmin()) {
            abort(403, 'केवल मुख्य व्यवस्थापक (Superadmin) ही दायित्व प्रबंधन कर सकते हैं।');
        }

        $daayitwas = Daayitwa::withCount('swayamsevaks')
            ->orderBy('unit_level')
            ->orderBy('name')
            ->get()
            ->map(function ($d) {
                return [
                    'id' => $d->id,
                    'name' => $d->name,
                    'unit_level' => $d->unit_level,
                    'unit_level_hindi' => $d->unit_level_hindi,
                    'swayamsevaks_count' => $d->swayamsevaks_count,
                    'created_at' => $d->created_at?->format('d/m/Y'),
                ];
            });

        return Inertia::render('Karyakarta/Daayitwa/Index', [
            'daayitwas' => $daayitwas,
            'unitLevels' => Daayitwa::UNIT_LEVELS,
        ]);
    }

    /**
     * Store a newly created Daayitwa.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user || !$user->isSuperAdmin()) {
            abort(403, 'केवल मुख्य व्यवस्थापक (Superadmin) ही दायित्व जोड़ सकते हैं।');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit_level' => 'required|string|in:kshetra,prant,vibhag,jila,nagar,nager,basti,shakha',
        ], [
            'name.required' => 'दायित्व का नाम अनिवार्य है।',
            'unit_level.required' => 'इकाई स्तर (Unit Level) चुनना अनिवार्य है।',
        ]);

        if ($validated['unit_level'] === 'nager') {
            $validated['unit_level'] = 'nagar';
        }

        Daayitwa::create($validated);

        return back()->with('success', "दायित्व '{$validated['name']}' सफलतापूर्वक जोड़ा गया।");
    }

    /**
     * Update an existing Daayitwa.
     */
    public function update(Request $request, Daayitwa $daayitwa): RedirectResponse
    {
        $user = $request->user();
        if (!$user || !$user->isSuperAdmin()) {
            abort(403, 'केवल मुख्य व्यवस्थापक (Superadmin) ही दायित्व संपादित कर सकते हैं।');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit_level' => 'required|string|in:kshetra,prant,vibhag,jila,nagar,nager,basti,shakha',
        ], [
            'name.required' => 'दायित्व का नाम अनिवार्य है।',
            'unit_level.required' => 'इकाई स्तर चुनना अनिवार्य है।',
        ]);

        if ($validated['unit_level'] === 'nager') {
            $validated['unit_level'] = 'nagar';
        }

        $daayitwa->update($validated);

        return back()->with('success', "दायित्व '{$validated['name']}' सफलतापूर्वक अपडेट किया गया।");
    }

    /**
     * Remove the specified Daayitwa.
     */
    public function destroy(Request $request, Daayitwa $daayitwa): RedirectResponse
    {
        $user = $request->user();
        if (!$user || !$user->isSuperAdmin()) {
            abort(403, 'केवल मुख्य व्यवस्थापक (Superadmin) ही दायित्व हटा सकते हैं।');
        }

        $name = $daayitwa->name;
        $daayitwa->delete();

        return back()->with('success', "दायित्व '{$name}' सफलतापूर्वक हटाया गया।");
    }
}
