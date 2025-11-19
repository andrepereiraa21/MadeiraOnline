"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Menu, X, Plus, MessageCircle, User, LogOut, Home } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          setUser(session?.user);
          fetchProfile(session?.user?.id);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      fetchProfile(user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
          >
            🏪 MarketPlace
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/")
                  ? "bg-emerald-50 text-emerald-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Home className="w-5 h-5" />
              Início
            </Link>

            {user ? (
              <>
                <Link
                  href="/criar-anuncio"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive("/criar-anuncio")
                      ? "bg-emerald-50 text-emerald-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  Criar Anúncio
                </Link>

                <Link
                  href="/chat"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive("/chat") || pathname?.startsWith("/chat/")
                      ? "bg-emerald-50 text-emerald-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  Mensagens
                </Link>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {profile?.nome?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.nome || user.email?.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-emerald-600 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  isActive("/")
                    ? "bg-emerald-50 text-emerald-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Home className="w-5 h-5" />
                Início
              </Link>

              {user ? (
                <>
                  <Link
                    href="/criar-anuncio"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                      isActive("/criar-anuncio")
                        ? "bg-emerald-50 text-emerald-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    Criar Anúncio
                  </Link>

                  <Link
                    href="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                      isActive("/chat") || pathname?.startsWith("/chat/")
                        ? "bg-emerald-50 text-emerald-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Mensagens
                  </Link>

                  <div className="px-4 py-3 border-t border-gray-200 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {profile?.nome?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {profile?.nome || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      <LogOut className="w-5 h-5" />
                      Sair
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-4 py-3 border-t border-gray-200 mt-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-gray-700 hover:text-emerald-600 font-medium py-2 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
                  >
                    Criar Conta
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
