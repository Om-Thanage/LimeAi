import React from 'react';
import {
  Popover,
  PopoverButton,
  PopoverBackdrop,
  PopoverPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

import { Button } from './Button';
import { Container } from './Container';
import { NavLink } from './NavLink';



function MobileNavLink({ href, children }) {
  return (
    <PopoverButton as={Link} to={href} className="block w-full p-2">
      {children}
    </PopoverButton>
  );
}

// Add a MobileNavigation component definition
function MobileNavigation() {
  return (
    <Popover>
      <PopoverButton
        className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none"
        aria-label="Toggle Navigation"
      >
        <span>Menu</span>
      </PopoverButton>
      <Transition>
        <TransitionChild
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <PopoverPanel className="absolute inset-x-0 top-full mt-4 flex flex-col bg-white p-4 shadow-lg">
            <MobileNavLink href="/login">Sign in</MobileNavLink>
            {/* Add more mobile nav links as needed */}
          </PopoverPanel>
        </TransitionChild>
      </Transition>
    </Popover>
  );
}

export function Header() {
  return (
    <header className="py-10">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link to="/" aria-label="Home">
              <img src="assets/images/LimeAi.svg" alt="LimeAi Logo" className="h-10 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            <div className="hidden md:block">
              <Button href="/login">Sign in</Button>
            </div>
            <Button href="/login" color="blue">
              <span>
                Get started <span className="hidden lg:inline">today</span>
              </span>
            </Button>
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}