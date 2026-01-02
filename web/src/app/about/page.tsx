'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  SparklesIcon,
  GlobeAltIcon,
  HeartIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserGroupIcon,
  PlayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// Stats data
const stats = [
  { label: 'Premium Brands', value: '500+' },
  { label: 'Happy Retailers', value: '10,000+' },
  { label: 'Products Available', value: '50,000+' },
  { label: 'Countries Served', value: '25+' },
];

// Values data
const values = [
  {
    icon: SparklesIcon,
    title: 'Premium Quality',
    description:
      'We partner exclusively with authentic, premium beauty brands to ensure every product meets the highest standards of quality and luxury.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Trusted Authenticity',
    description:
      'Every product is 100% authentic and sourced directly from authorized distributors. We guarantee the integrity of every item we sell.',
  },
  {
    icon: HeartIcon,
    title: 'Customer First',
    description:
      'Your success is our priority. Our dedicated team provides personalized support to help your business thrive and grow.',
  },
  {
    icon: GlobeAltIcon,
    title: 'Global Reach',
    description:
      'From our state-of-the-art facilities, we serve retailers across 25+ countries with reliable, fast shipping worldwide.',
  },
  {
    icon: TruckIcon,
    title: 'Fast Fulfillment',
    description:
      'Orders ship within 24-48 hours. Our streamlined logistics ensure your products arrive quickly and in perfect condition.',
  },
  {
    icon: UserGroupIcon,
    title: 'Expert Support',
    description:
      'Our beauty industry experts are here to help you curate the perfect product selection for your unique customer base.',
  },
];

// Timeline milestones
const milestones = [
  {
    year: '2018',
    title: 'The Beginning',
    description:
      'FemmeLux Beauty was founded with a vision to revolutionize the B2B beauty wholesale industry.',
  },
  {
    year: '2019',
    title: 'First 100 Partners',
    description:
      'Reached our first milestone of 100 retail partners and expanded our brand portfolio to 50+ premium brands.',
  },
  {
    year: '2020',
    title: 'Digital Transformation',
    description:
      'Launched our state-of-the-art e-commerce platform, making wholesale ordering seamless and efficient.',
  },
  {
    year: '2021',
    title: 'International Expansion',
    description:
      'Extended our reach to serve retailers across Europe, Middle East, and Asia Pacific regions.',
  },
  {
    year: '2022',
    title: 'Sustainability Initiative',
    description:
      'Committed to eco-friendly packaging and partnered with carbon-neutral shipping providers.',
  },
  {
    year: '2023',
    title: '10,000 Partners',
    description:
      'Celebrated serving over 10,000 satisfied retail partners worldwide with 500+ premium brands.',
  },
];

// Gallery images (using placeholder URLs - replace with actual images)
const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    alt: 'Luxury beauty products display',
    span: 'col-span-2 row-span-2',
  },
  {
    src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    alt: 'Premium skincare collection',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80',
    alt: 'Beauty salon interior',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&q=80',
    alt: 'Makeup artistry',
    span: 'col-span-1 row-span-2',
  },
  {
    src: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
    alt: 'Luxury perfume bottles',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=600&q=80',
    alt: 'Premium cosmetics packaging',
    span: 'col-span-1 row-span-1',
  },
];

export default function AboutPage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Video Background */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1920&q=80"
          >
            <source
              src="https://cdn.coverr.co/videos/coverr-woman-applying-makeup-2273/1080p.mp4"
              type="video/mp4"
            />
          </video>
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-900/80 via-secondary-900/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative h-full container mx-auto px-4 flex items-center">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-primary-500/30">
              Established 2018
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Where Beauty
              <span className="block text-primary-400">Meets Business</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              FemmeLux Beauty is the premier B2B wholesale destination for
              discerning retailers seeking the world's most coveted beauty
              brands. We bridge the gap between luxury and accessibility.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
              >
                Become a Partner
              </Link>
              <button
                onClick={() => setIsVideoPlaying(true)}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                Watch Our Story
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-20 z-10">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80"
                      alt="Beauty products"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80"
                      alt="Luxury salon"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&q=80"
                      alt="Makeup artistry"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80"
                      alt="Premium perfumes"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-100 rounded-full -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary-50 rounded-full -z-10" />
            </div>

            {/* Story Content */}
            <div>
              <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">
                Our Story
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-secondary-800 mt-3 mb-6">
                A Legacy of Luxury & Excellence
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2018, FemmeLux Beauty emerged from a simple yet
                  powerful vision: to democratize access to the world's most
                  prestigious beauty brands for retailers of all sizes.
                </p>
                <p>
                  What began as a small operation with just a handful of brand
                  partnerships has blossomed into a global wholesale powerhouse,
                  serving over 10,000 retail partners across 25+ countries.
                </p>
                <p>
                  Our founder, inspired by years of experience in the luxury
                  beauty industry, recognized the challenges faced by
                  independent retailers seeking authentic, premium products at
                  competitive wholesale prices. FemmeLux was born to bridge this
                  gap.
                </p>
                <p>
                  Today, we proudly partner with 500+ premium brands, from
                  iconic heritage houses to innovative indie labels, ensuring
                  our retail partners always have access to the products their
                  customers desire.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <SparklesIcon className="w-8 h-8 text-primary-500" />
                </div>
                <div>
                  <div className="font-semibold text-secondary-800">
                    Premium Selection
                  </div>
                  <div className="text-gray-500">
                    Curated luxury beauty brands
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">
              Our Values
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-800 mt-3 mb-6">
              What Drives Us Forward
            </h2>
            <p className="text-gray-600 text-lg">
              At FemmeLux Beauty, our core values guide everything we do. They
              shape our partnerships, our service, and our commitment to your
              success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group p-8 bg-gray-50 rounded-2xl hover:bg-primary-500 transition-all duration-500 hover:shadow-xl hover:shadow-primary-500/20"
              >
                <div className="w-14 h-14 bg-primary-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center mb-6 transition-colors duration-500">
                  <value.icon className="w-7 h-7 text-primary-500 group-hover:text-white transition-colors duration-500" />
                </div>
                <h3 className="text-xl font-bold text-secondary-800 group-hover:text-white mb-3 transition-colors duration-500">
                  {value.title}
                </h3>
                <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-24 bg-secondary-800">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider">
              Our Journey
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6">
              Milestones of Excellence
            </h2>
            <p className="text-gray-400 text-lg">
              From humble beginnings to industry leadership, every step of our
              journey has been guided by our commitment to excellence.
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary-500/30 hidden lg:block" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  <div
                    className={`flex-1 ${
                      index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'
                    }`}
                  >
                    <div className="bg-secondary-700/50 p-6 rounded-2xl backdrop-blur-sm border border-white/5">
                      <span className="text-primary-400 font-bold text-lg">
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-2 mb-3">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-400">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 hidden lg:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">
              Our World
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-800 mt-3 mb-6">
              A Glimpse Into Luxury
            </h2>
            <p className="text-gray-600 text-lg">
              Explore the world of FemmeLux Beauty through our curated gallery
              showcasing the elegance and sophistication of our brand
              partnerships.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${image.span}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-medium">{image.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">
                Experience FemmeLux
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-secondary-800 mt-3 mb-6">
                Beauty Beyond Boundaries
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Step into our world where luxury meets accessibility. Our
                state-of-the-art facilities and passionate team work tirelessly
                to bring you the finest beauty products from around the globe.
              </p>
              <ul className="space-y-4">
                {[
                  'Direct partnerships with 500+ premium brands',
                  'Climate-controlled warehousing for product integrity',
                  '24-48 hour order fulfillment',
                  'Dedicated account managers for personalized service',
                  'Sustainable packaging initiatives',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <video
                controls
                poster="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80"
                className="w-full h-full object-cover"
              >
                <source
                  src="https://cdn.coverr.co/videos/coverr-various-cosmetic-products-on-pink-background-7907/1080p.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-secondary-900/30 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/50">
                  <PlayIcon className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Elevate Your Business?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10">
            Join thousands of successful retailers who trust FemmeLux Beauty
            for their premium wholesale needs. Apply today and unlock exclusive
            access to the world's finest beauty brands.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Apply for Partnership
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-colors"
            >
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isVideoPlaying && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setIsVideoPlaying(false)}
        >
          <div
            className="relative w-full max-w-5xl mx-4 aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute -top-12 right-0 text-white hover:text-primary-400 transition-colors"
            >
              <span className="text-lg font-medium">Close</span>
            </button>
            <video
              autoPlay
              controls
              className="w-full h-full rounded-lg shadow-2xl"
            >
              <source
                src="https://cdn.coverr.co/videos/coverr-beauty-products-on-a-marble-surface-3809/1080p.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
