import { createElement, forwardRef } from 'react'

/**
 * Stand-ins for the DSH UI primitives, for tests that have to render the real settings section
 * without the DSH shell. Only the props the section itself uses are modelled; the DOM shape
 * (a real <button> / <input>) is what the tests click and type into.
 */

/** @param props - the primitive's props (variant/size/icon are decoration here). */
export function Button(props: any): any {
  const { variant, size, icon, children, ...rest } = props
  return createElement('button', { type: 'button', 'data-variant': variant, ...rest }, icon ?? null, children)
}

/** @param props - the primitive's props (active is decoration here). */
export function Pill(props: any): any {
  const { active, children, ...rest } = props
  return createElement('button', { type: 'button', 'data-active': String(active ?? false), ...rest }, children)
}

export const Input = forwardRef(function Input(props: any, ref: any): any {
  return createElement('input', { ref, ...props })
})

/** @param props - the primitive's props. */
export function Modal(props: any): any {
  return createElement('div', { 'data-modal': '1' }, props.children)
}
