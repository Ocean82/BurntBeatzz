"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Music, User, Settings, Download, Trophy, Coins, LogOut } from "lucide-react"

interface AppHeaderProps {
  user?: {
    username: string
    credits: number
    avatar?: string
  }
}

export function AppHeader({ user }: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: "Create", href: "/create", icon: Music },
    { name: "Discover", href: "/discover", icon: Music },
    { name: "Contests", href: "/contests", icon: Trophy },
    { name: "Library", href: "/library", icon: Download },
  ]

  return (
    <header className="bg-black/80 backdrop-blur-sm border-b border-orange-500/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logos/burnt-beats-cute-fox.jpeg" alt="Burnt Beats" className="w-10 h-10 rounded-lg" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-orange-300">Burnt Beats</h1>
              <p className="text-xs text-gray-400">AI Music Studio</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="text-gray-300 hover:text-orange-300 hover:bg-orange-500/10"
                  onClick={() => (window.location.href = item.href)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Button>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Credits Display */}
                <div className="hidden sm:flex items-center gap-2 bg-black/40 rounded-lg px-3 py-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">{user.credits}</span>
                  <span className="text-xs text-gray-400">credits</span>
                </div>

                {/* User Menu */}
                <div className="relative group">
                  <Button variant="ghost" className="flex items-center gap-2 text-gray-300 hover:text-orange-300">
                    {user.avatar ? (
                      <img
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{user.username}</span>
                  </Button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-orange-500/30 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2 space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-300 hover:text-orange-300 hover:bg-orange-500/10"
                        onClick={() => (window.location.href = "/profile")}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-300 hover:text-orange-300 hover:bg-orange-500/10"
                        onClick={() => (window.location.href = "/settings")}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-300 hover:text-orange-300 hover:bg-orange-500/10"
                        onClick={() => (window.location.href = "/credits")}
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Buy Credits
                      </Button>
                      <hr className="border-gray-700 my-1" />
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => {
                          // Handle logout
                          window.location.href = "/auth/login"
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-orange-300"
                  onClick={() => (window.location.href = "/auth/login")}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  onClick={() => (window.location.href = "/auth/register")}
                >
                  Join Free
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-300 hover:text-orange-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-orange-500/30 py-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-orange-300 hover:bg-orange-500/10"
                    onClick={() => {
                      window.location.href = item.href
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                )
              })}

              {user && (
                <>
                  <hr className="border-gray-700 my-2" />
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-gray-400">Credits</span>
                    <Badge className="bg-yellow-500 text-black">{user.credits}</Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
