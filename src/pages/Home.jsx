import React from "react";
import Hero from "@/components/home/Hero";
import ServiceMatrix from "@/components/home/ServiceMatrix";
import GarmentCategories from "@/components/home/GarmentCategories";
import VIPVault from "@/components/home/VIPVault";
import HowItWorks from "@/components/home/HowItWorks";
import DownloadSource from "@/components/home/DownloadSource";
import TrackCta from "@/components/home/TrackCta";

export default function Home() {
  return (
    <>
      <Hero />
      <ServiceMatrix />
      <GarmentCategories />
      <VIPVault />
      <HowItWorks />
      <DownloadSource />
      <TrackCta />
    </>
  );
}