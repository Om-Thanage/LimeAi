import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const baseStyles = {
  solid:
    'group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
  outline:
    'group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-none',
};

const variantStyles = {
  solid: {
    slate:
      'bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900',
    blue: 'bg-blue-600 text-white hover:text-slate-100 hover:bg-blue-500 active:bg-blue-800 active:text-blue-100 focus-visible:outline-blue-600',
    white:
      'bg-white text-slate-900 hover:bg-blue-50 active:bg-blue-200 active:text-slate-600 focus-visible:outline-white',
    green:
      'bg-green-600 text-white hover:bg-green-500 hover:text-white active:bg-green-700 active:text-green-100 focus-visible:outline-green-600', 
  },
  outline: {
    slate:
      'ring-slate-200 text-slate-700 hover:text-slate-900 hover:ring-slate-300 active:bg-slate-100 active:text-slate-600 focus-visible:outline-blue-600 focus-visible:ring-slate-300',
    white:
      'ring-slate-700 text-white hover:ring-slate-500 active:ring-slate-700 active:text-slate-400 focus-visible:outline-white',
    green:
      'ring-green-600 text-green-600 hover:ring-green-700 hover:text-green-700 active:bg-green-100 active:text-green-700 focus-visible:outline-green-600',
  },
};

export function Button({ className, ...props }) {
  props.variant ??= 'solid';
  props.color ??= 'slate';

  className = clsx(
    baseStyles[props.variant],
    props.variant === 'outline'
      ? variantStyles.outline[props.color]
      : props.variant === 'solid'
        ? variantStyles.solid[props.color]
        : undefined,
    className,
  );

  // Check if the href is external (starts with http or https)
  const isExternalLink = props.href?.startsWith('http');
  
  return typeof props.href === 'undefined' ? (
    <button className={className} {...props} />
  ) : isExternalLink ? (
    // Use regular anchor tag for external links with target="_blank" and security attributes
    <a 
      href={props.href} 
      className={className} 
      target="_blank" 
      rel="noopener noreferrer"
      {...props}
    >
      {props.children}
    </a>
  ) : (
    // Use React Router's Link for internal navigation
    <Link to={props.href} className={className} {...props} />
  );
}
