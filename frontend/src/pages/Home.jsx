import React from 'react'
import { Hero } from '../components/Hero'
import { PrimaryFeatures } from '../components/PrimaryFeatures'
import { CallToAction } from '../components/CallToAction'
import { Pricing } from '../components/Pricing'

export default function Home() {
  return (
    <>
      <Hero />
      <PrimaryFeatures />
      <CallToAction />
      <Pricing />
    </>
  )
}