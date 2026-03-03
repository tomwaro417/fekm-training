export default function AdminSettings() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Configuration de l'espace administrateur</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
        <p className="text-gray-600">
          Cette section permettra de configurer les paramètres globaux de l'application.
          <br />
          Fonctionnalités à venir :
        </p>
        <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
          <li>Configuration des emails</li>
          <li>Paramètres de sécurité</li>
          <li>Personnalisation de l'interface</li>
          <li>Gestion des sauvegardes</li>
        </ul>
      </div>
    </div>
  )
}