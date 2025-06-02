"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, BarChart2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import VisuallyHidden from "@/components/ui/visuallyhidden"

// Main navigation links - simplified without dropdowns
const mainNavLinks = [
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" }
];

export default function NavbarClient() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  // Handle scroll events to change navbar style
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Handle hash change and smooth scroll
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  // Logo animation variants
  const logoVariants = {
    normal: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  }

  // Button animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } }
  }

  // Mobile navigation
  const MobileNav = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Menu"
          className="text-slate-300 hover:text-white hover:bg-slate-800/50"
        >
          <Menu className="h-6 w-6" />
          <VisuallyHidden>Open menu</VisuallyHidden>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-slate-950 border-slate-800">
        <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
          Databuddy
        </SheetTitle>
        <nav className="flex flex-col space-y-4 mt-8">
          <ul className="space-y-1">
            {mainNavLinks.map((item) => (
              <li key={item.name}>
                <SheetClose asChild>
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={cn(
                      "flex items-center gap-2 p-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800/50 rounded-md transition-colors",
                      pathname === item.href && "text-sky-400 bg-slate-800/30"
                    )}
                  >
                    <span>{item.name}</span>
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SheetClose asChild>
              <Button asChild className="w-full bg-sky-500 hover:bg-sky-600">
                <Link href="https://app.databuddy.cc" target="_blank" rel="noopener noreferrer">Get Started</Link>
              </Button>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "py-2 bg-slate-950 backdrop-blur-xl border-b border-sky-500/10" 
          : "py-4 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            variants={logoVariants}
            initial="normal"
            whileHover="hover"
          >
            <Link
              href="/"
              className="relative group flex items-center"
            >
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                Databuddy
              </span>
              <motion.div 
                className="absolute -inset-1 rounded-lg bg-gradient-to-r from-sky-500/20 to-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Main Links */}
            <div className="flex items-center gap-5">
              {mainNavLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={cn(
                    "text-sm font-medium text-slate-200 hover:text-sky-400 transition-colors",
                    pathname === item.href && "text-sky-400"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* Demo Button */}
            <div className="h-6 w-px bg-slate-800 mx-1" />
            <motion.div
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Link 
                href="/demo" 
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20"
              >
                <span className="inline-flex"><BarChart2 className="h-4 w-4" /></span>
                <span>Live Demo</span>
              </Link>
            </motion.div>
            
            {/* CTA Button */}
            <motion.div
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className="ml-1"
            >
              <Button 
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 font-medium shadow-lg shadow-sky-500/20 rounded-full group"
                size="sm"
                asChild
              >
                <Link href="https://app.databuddy.cc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                  Get Started
                  <span className="inline-flex"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex items-center gap-3">
            <MobileNav />
          </div>
        </div>
      </div>
    </motion.nav>
  )
} 