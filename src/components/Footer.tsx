export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">FEKM Training</h3>
            <p className="text-gray-400 text-sm">
              Application de progression et d&apos;entraînement pour la Fédération Européenne de Krav Maga.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/" className="hover:text-white transition-colors">Accueil</a></li>
              <li><a href="/ceintures" className="hover:text-white transition-colors">Ceintures</a></li>
              <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-gray-400 text-sm">
              Pour toute question, contactez votre instructeur FEKM.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} FEKM Training. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
