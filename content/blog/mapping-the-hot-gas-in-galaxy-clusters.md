---
title: Mapping the Hot Gas in Galaxy Clusters
description: Turning raw Chandra X-ray observations into spatially-resolved temperature, pressure, and density maps — and why those maps are how you find a radio mini-halo.
date: 2026-03-02
minRead: 5
author:
  name: MD Shahadat Hossain Shahal
  avatar:
    src: /avatar.jpg
    alt: MD Shahadat Hossain Shahal
---

Galaxy clusters are the largest gravitationally bound structures in the universe, and most of their ordinary matter is not in the galaxies at all — it is in the **intracluster medium**, a diffuse plasma at ten to a hundred million kelvin that radiates X-rays through thermal bremsstrahlung.

That emission is the diagnostic. If you can measure the spectrum region by region, you can map the temperature, pressure, and density of the gas across the cluster, and those maps reveal what the cluster has been doing: sloshing, merging, driving shocks and cold fronts.

## The pipeline

The work is spatially-resolved spectroscopy on Chandra ACIS data:

1. **Reprocess** the observation and clean flares out of the light curve.
2. **Bin adaptively.** A single pixel has nowhere near enough counts to fit a spectrum, so regions are grown until each holds enough signal for a stable fit — spatial resolution traded against signal-to-noise, everywhere in the field.
3. **Fit** a thermal plasma model per region and propagate the uncertainties honestly.
4. **Assemble** the per-region results into temperature, pressure, and density maps.

## What I am looking for

Radio **mini-haloes** — faint, diffuse radio emission in the cores of relaxed clusters, thought to be powered by turbulence re-accelerating relativistic electrons. If that picture is right, the radio emission should be correlated with the thermal structure of the gas: with cold fronts, with sloshing spirals, with the disturbances the X-ray maps make visible.

Which is the reason the two halves of my research keep meeting. The radio side finds the sources; the X-ray side explains the environment that bent them.
