import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex font-sans antialiased">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-all duration-300">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center gap-4">
                {/* Mobile Logo */}
                <div className="flex shrink-0 items-center md:hidden">
                  <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex sm:items-center sm:ms-6">
                <div className="relative ms-3">
                  <div className="flex items-center gap-2 rounded-full border border-transparent bg-white dark:bg-gray-800 py-1 pl-3 pr-1 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out shadow-sm border-gray-200 dark:border-gray-700">
                    <span>Game Collector</span>
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        
        <footer className="py-6 text-center text-sm text-gray-400 dark:text-gray-600">
          <div className="flex justify-center gap-4 mb-2">
            <a href="#" className="hover:text-gray-600 dark:hover:text-gray-400">Privacy</a>
            <a href="#" className="hover:text-gray-600 dark:hover:text-gray-400">Terms</a>
            <a href="#" className="hover:text-gray-600 dark:hover:text-gray-400">Help</a>
          </div>
          &copy; {new Date().getFullYear()} Game Collector
        </footer>
      </div>
    </div>
  );
};

export default Layout;