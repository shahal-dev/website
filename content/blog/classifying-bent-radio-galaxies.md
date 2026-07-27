---
title: Teaching a Neural Network to Recognise Bent Radio Galaxies
description: How the Radio Galaxy Classifier (RGC) uses semi-supervised learning and rotation-equivariant CNNs to sort Wide-Angle Tail from Narrow-Angle Tail radio AGNs.
date: 2025-11-10
minRead: 6
author:
  name: MD Shahadat Hossain Shahal
  avatar:
    src: /avatar.jpg
    alt: MD Shahadat Hossain Shahal
---

Radio surveys now produce more sources than anyone can inspect by eye. That is the plain motivation behind RGC — the Radio Galaxy Classifier I built as my undergraduate thesis at the Center for Astronomy, Space Science and Astrophysics (CASSA).

## Why bent sources are hard

Radio-loud active galactic nuclei launch jets that can extend far beyond their host galaxy. When the host moves through the hot gas of a cluster, ram pressure sweeps those jets backwards, producing **bent-tail** morphologies: Wide-Angle Tail (WAT) sources with a broad V, and Narrow-Angle Tail (NAT) sources swept into a tight, almost parallel pair of tails.

The distinction matters — the bend angle traces the interaction between the jets and the intracluster medium, which makes these objects useful signposts for clusters themselves. But the difference between a WAT and a NAT is a matter of geometry and degree, and radio images are noisy, low-contrast, and arbitrarily rotated.

## Two design decisions

**Rotation equivariance.** A radio galaxy has no preferred orientation on the sky, but an ordinary CNN has to learn that fact from data — burning capacity on something we already know. Using `e2cnn` builds the rotational symmetry into the network's structure instead, so a rotated source is recognised as the same source by construction. On a small, imbalanced dataset that buys a lot.

**Semi-supervised training.** Labelled bent sources are scarce; unlabelled cutouts are essentially free. Letting the model learn structure from the unlabelled pool first, then fine-tuning on the labels we trust, gets far more out of a small annotated set than supervised training alone.

## Where it stands

The first paper — *RGC: a radio AGN classifier based on deep learning. I. A semi-supervised model for the VLA images of bent radio AGNs* — covers the VLA imagery. My current work at CASSA broadens the same model so a single network also handles sFRI and sFRII sources, rather than training a separate classifier per morphology.

The code is on [GitHub](https://github.com/shahal-dev/RGC).
