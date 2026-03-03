export default function AdminStats() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques détaillées</h1>
        <p className="text-gray-600 mt-1">Analyses et statistiques de la plateforme</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiques avancées</h2>
        <p className="text-gray-600">
          Cette section affichera des statistiques détaillées sur l'utilisation de la plateforme.
          <br />
          Fonctionnalités à venir :
        </p>
        <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
          <li>Progression des élèves</li>
          <li>Techniques les plus consultées</li>
          <li>Taux d'acquisition par ceinture</li>
          <li>Activité des instructeurs</li>
          <li>Graphiques et visualisations</li>
        </ul>
      </div>
    </div>
  )
}