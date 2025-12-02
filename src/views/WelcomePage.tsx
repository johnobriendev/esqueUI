// src/components/auth/WelcomePage.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const WelcomePage: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  // If already authenticated or still loading, don't show the welcome page
  if (isAuthenticated || isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="pt-6 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xl">E</div>
          <span className="ml-2 text-2xl font-semibold text-blue-50">Esque</span>
        </div>
        <button
          onClick={() => loginWithRedirect({
            authorizationParams: {
              prompt: 'login'
            }
          })}
          className="px-4 py-2 text-sm font-medium text-blue-400 border border-blue-500 rounded-md hover:bg-slate-800 transition-colors"
        >
          Log in
        </button>
      </nav>

      {/* Hero Section */}
      <div className="h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col justify-center items-center xl:gap-10 max-w-6xl lg:mt-8 xl:mt-0">
          <div className="flex flex-col lg:flex-row items-center gap-12 w-full xl:mt-[-8rem]">
            {/* Left Content */}
            <div className="lg:w-1/2 flex flex-col items-start">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-50 leading-tight">
                Organize your work, get more <span className="text-blue-400">done</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-xl">
                A powerful task management tool to help you finish your projects faster
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={() => loginWithRedirect({
                    authorizationParams: {
                      prompt: 'login'
                    }
                  })}
                  className="px-8 py-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Get Started — It's Free
                </button>
              </div>
            </div>

            {/* Right Content - Floating UI */}
            <div className="lg:w-1/2 relative w-full max-w-lg lg:max-w-none">
              {/* Fixed the problematic rotated background */}
              <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl transform rotate-1 opacity-5"></div>
              <div className="relative bg-slate-800 p-6 sm:p-8 rounded-xl shadow-xl border border-slate-700 mx-4 lg:mx-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-4 bg-slate-700 rounded"></div>
                    <div className="w-4 h-4 bg-slate-700 rounded-full"></div>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <div className="w-32 h-6 bg-blue-400 rounded"></div>
                  <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="col-span-1 bg-slate-700 p-4 rounded-lg">
                    <div className="w-full h-3 bg-slate-600 rounded mb-2"></div>
                    <div className="w-2/3 h-3 bg-slate-600 rounded mb-4"></div>
                    <div className="w-full h-24 bg-blue-400 rounded"></div>
                  </div>
                  <div className="col-span-2 bg-slate-700 p-4 rounded-lg">
                    <div className="w-full h-3 bg-slate-600 rounded mb-2"></div>
                    <div className="w-2/3 h-3 bg-slate-600 rounded mb-4"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="w-full h-12 bg-green-400 rounded"></div>
                      <div className="w-full h-12 bg-orange-400 rounded"></div>
                      <div className="w-full h-12 bg-purple-400 rounded"></div>
                      <div className="w-full h-12 bg-red-400 rounded"></div>
                    </div>
                  </div>
                </div>

                <div className="h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  <div className="w-28 h-4 bg-slate-600 rounded mx-auto"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Descriptive phrase */}
          {/* <p className="text-center text-sm sm:text-2xl text-slate-400 mt-8">
            Team collaboration • Flexible views • Smart organization
          </p> */}
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 sm:px-6 py-16 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-blue-50">Everything you need to stay organized</h2>
          <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
            Powerful features to help you manage tasks, organize projects, and optimize your work flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Work Together",
              description: "Invite your team, share projects, and keep everyone in sync with comments and updates.",
              icon: (
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )
            },
            {
              title: "See It Your Way",
              description: "Switch between list and Kanban views. Group by status or priority. Whatever works for you.",
              icon: (
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )
            },
            {
              title: "Stay Organized",
              description: "Manage multiple projects in one place. Track what matters with custom fields and smart filtering.",
              icon: (
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )
            }
          ].map((feature, index) => (
            <div key={index} className="bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-700 hover:shadow-xl transition-shadow">
              <div className="bg-blue-900 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-blue-50 mb-3">{feature.title}</h3>
              <p className="text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-950 py-16">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-7xl">
          <h2 className="text-3xl font-bold text-blue-50 mb-4">
            Ready to organize your workflow?
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join our community of users who are already boosting their productivity with Esque.
          </p>
          <button
            onClick={() => loginWithRedirect({
              authorizationParams: {
                prompt: 'login'
              }
            })}
            className="px-8 py-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            Get Started For Free
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">E</div>
              <span className="ml-2 text-lg font-semibold text-blue-50">Esque</span>
            </div>
            <div className="text-sm text-slate-400">
              © {new Date().getFullYear()} Esque. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;


