SpectraVis
==========

An interactive network visualization tool for exploring [functional brain connectivity](http://www.scholarpedia.org/article/Brain_connectivity) using [d3.js](http://d3js.org/). See [this](http://ericdeno.com/research/SpectraVis/) for an example of SpectraVis in action.

![](./SpectraVis-Demo.gif)

SpectraVis allows you to:
+ examine how network dynamics change over time and frequency
+ compare local (statistical dependencies between a single pair of nodes) and global (statistical dependencies between all nodes) dynamics.
+ compare different types of functional connectivity measures (correlation, coherence).
+ compare between different subjects.
+ examine only within- or between-brain area connections
+ switch between multiple network views for better understanding of the network structure

## Installation
To install SpectraVis, download the latest release:
+  [https://github.com/edeno/SpectraVis/releases](https://github.com/edeno/SpectraVis/releases)

Or use Node.js and its package manager (npm):

1. Open a terminal (Mac) or a Windows Command Prompt (`Start > All Programs > Accessories > Windows Command Prompt `)
2. Download or clone the repository: `git clone https://github.com/edeno/SpectraVis.git`
3. Install Node.js using one of the [installers](https://nodejs.org/).
4. Enter in the terminal or command prompt: `npm install spectravis`

This will install the relevant development dependencies. Running `gulp` in the terminal will automatically launch a webserver on [http://localhost:8000/](http://localhost:8000/) where you can view the visualization.

## Usage
`spectravis.init(params)` starts the visualization in `index.html`.

See the [wiki](https://github.com/edeno/SpectraVis/wiki) for more information on how to view the visualization on your local machine, the expected structure of the data, and converting data from Matlab to JSON.

## Modifying and Contributing
Fork, then clone the repo:
````
git clone git@github.com/your-username/SpectraVis.git
````
Use `npm install` to get the development dependencies. Place your Data in `app/DATA/`.

Push to your fork and submit a pull request to the `develop` branch.

## License
[GPL-v2](http://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
