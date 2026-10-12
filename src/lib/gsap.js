/**
 * Single place to register GSAP plugins and shared animation tokens.
 * Easing: power3.out for reveals, expo.inOut for scene transitions,
 * linear (none) only for marquees.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

export const EASE = {
  out: 'power3.out',
  inOut: 'expo.inOut',
}

export const DUR = {
  micro: 0.3,
  reveal: 1,
  scene: 1.5,
}

export const STAGGER = 0.08

export { gsap, ScrollTrigger, SplitText, useGSAP }
