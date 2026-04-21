# SAP Procure-to-Pay (P2P) Cycle Simulator

An interactive web-based simulation of the SAP MM Procure-to-Pay business process.

## Live Demo

Open `index.html` 

## What It Simulates

The full P2P cycle in 5 interactive steps:

| Step | Document | T-Code | Key Tables |
|------|----------|--------|------------|
| 1 | Purchase Requisition (PR) | ME51N | EBAN |
| 2 | Quotation (RFQ) | ME41 / ME47 / ME49 | EKKO, EKPO |
| 3 | Purchase Order (PO) | ME21N | EKKO, EKPO |
| 4 | Goods Receipt (GR) | MIGO (101) | MKPF, MSEG, MARD |
| 5 | Invoice Verification – 3-Way Match | MIRO | BKPF, BSEG, BSIK |
| 6 | Vendor Payment | F110 | BKPF, BSEG, BSAK |

## Key Features

- Step-by-step guided workflow with progress stepper
- **3-Way Match validation** — blocks invoice if qty > GR qty (exactly like SAP)
- Real SAP T-codes, table names, and accounting entries shown at each step
- Auto-generated document numbers (PR, PO, GR, Invoice, Payment)
- Full document chain summary on completion
- Zero dependencies — plain HTML + CSS + JS

## How to Run

1. Download or clone this repository
2. Open `index.html`
3. Fill in each step and click the action button to proceed

## Tech Stack

- HTML5
- CSS3 (CSS custom properties, grid layout)
- Vanilla JavaScript (ES6+)

## Project Structure

```
p2p-simulator/
├── index.html          # Main application
├── styles.css          # All styles
├── app.js              # Application logic
├── documentation.pdf   # Project report
└── README.md           # This file
```

## Learning Outcomes

After completing a full cycle in the simulator you will understand:
- The exact sequence of SAP documents in P2P
- Which database tables are updated at each step
- How MM-FI integration works (automatic accounting entries)
- Why the 3-way match is critical in MIRO
- How document numbers link the entire procurement chain

## Author

SAI KRISHNA DHAL 23053236
