/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EcoTip {
  id: string;
  title: string;
  category: 'Waste Reduction' | 'Recycling Trivia' | 'Energy Saving' | 'Water Conservation' | 'Civic Duty';
  content: string;
  impact: string;
  icon: string;
  funFact?: string;
}

export const ECO_TIPS: EcoTip[] = [
  {
    id: 'tip-1',
    title: 'The "Scrunch Test" for Plastics',
    category: 'Waste Reduction',
    content: 'If you can scrunch plastic wrap or packaging into a tight ball and it stays scrunched, it can typically be recycled at supermarket soft plastic drops. If it springs back, it belongs in the general trash.',
    impact: 'Reduces contamination in curbside recycling bins',
    icon: '🛍️',
    funFact: 'Soft plastics are one of the biggest jam-causers for automated recycling facility conveyor belts.'
  },
  {
    id: 'tip-2',
    title: 'Infinite Aluminium Lifecycle',
    category: 'Recycling Trivia',
    content: 'Aluminium cans are 100% recyclable and can be melted down and re-manufactured indefinitely without any loss in material quality. Recycling a can saves 95% of the energy needed to make a new one.',
    impact: 'Saves massive amounts of mining energy',
    icon: '🥫',
    funFact: 'Nearly 75% of all aluminium ever produced in the history of humanity is still in active use today!'
  },
  {
    id: 'tip-3',
    title: 'Beware of Greasy Pizza Boxes',
    category: 'Waste Reduction',
    content: 'Cardboard pizza boxes are only recyclable if they are free of food grease. Grease prevents paper fibers from binding during processing. Rip off the clean top half to recycle, and compost or throw away the greasy bottom.',
    impact: 'Avoids ruining whole batches of paper recycling',
    icon: '🍕',
    funFact: 'A single greasy cardboard box can contaminate thousands of liters of clean paper slurry.'
  },
  {
    id: 'tip-4',
    title: 'Always Rinse Food Jars First',
    category: 'Recycling Trivia',
    content: 'Leftover food scraps like sticky jam, honey, or peanut butter in plastic or glass jars attract pests and contaminate recycling machinery. Give your containers a quick rinse or soak before tossing them into the bin.',
    impact: 'Increases local recycling success rate',
    icon: '🫙',
    funFact: 'Slightly dirty jars are often rejected at manual sorting stations and sent straight to the landfill.'
  },
  {
    id: 'tip-5',
    title: 'Avoid the "Wishcycling" Trap',
    category: 'Civic Duty',
    content: '"Wishcycling" is putting non-recyclable items (like garden hoses, toys, or batteries) into the recycling bin, hoping workers will sort it out. This slows down sorting centers and can damage expensive machinery.',
    impact: 'Increases municipal sorting efficiency',
    icon: '⚠️',
    funFact: 'Batteries incorrectly tossed into recycling bins are the leading cause of fires at sorting facilities.'
  },
  {
    id: 'tip-6',
    title: 'Disposable Coffee Cups Aren\'t Simple Paper',
    category: 'Waste Reduction',
    content: 'Most disposable hot beverage cups are lined with a microscopic polyethylene plastic film to keep them waterproof. This complex bond makes them extremely difficult to recycle in standard paper mills.',
    impact: 'Prevents massive non-biodegradable cup build-ups',
    icon: '☕',
    funFact: 'Over 500 billion single-use coffee cups are thrown away globally every year!'
  },
  {
    id: 'tip-7',
    title: 'Beat the "Vampire Power" Drain',
    category: 'Energy Saving',
    content: 'Electronics plugged in but turned off (like TVs, chargers, or microwaves) still consume trickle electricity known as "Vampire Power". Use smart power strips to completely cut current flow when they aren\'t in use.',
    impact: 'Reduces household electricity waste by up to 10%',
    icon: '🔌',
    funFact: 'Vampire power accounts for roughly 1% of total global greenhouse gas emissions.'
  },
  {
    id: 'tip-8',
    title: 'The Tremendous Save of Paper',
    category: 'Recycling Trivia',
    content: 'Recycling one single ton of paper can save approximately 17 fully grown trees, 26,500 liters of fresh water, 2.3 cubic meters of landfill space, and 4,000 kilowatt-hours of electrical energy.',
    impact: 'Preserves forest biodiversity and water tables',
    icon: '📄',
    funFact: 'Paper fibers can be recycled 5 to 7 times before they become too short to bind together.'
  },
  {
    id: 'tip-9',
    title: 'Mesh Bags are the New Standard',
    category: 'Waste Reduction',
    content: 'When shopping for fresh fruits or vegetables, swap single-use thin plastic produce bags for lightweight, washable organic cotton mesh bags. They keep produce fresh and aerated longer!',
    impact: 'Eliminates hundreds of plastic bags per household yearly',
    icon: '🧅',
    funFact: 'The average single-use plastic bag is used for only 12 minutes before being discarded.'
  },
  {
    id: 'tip-10',
    title: 'Toxic Heavy E-Waste',
    category: 'Civic Duty',
    content: 'Electronic waste (e-waste) represents only 2% of total solid landfill volume, but accounts for over 70% of heavy metal and toxic chemical contamination. Never throw phones or laptops in the general garbage.',
    impact: 'Prevents lithium, lead, and mercury from poisoning soil',
    icon: '💻',
    funFact: 'Up to 324 times more gold can be extracted from one ton of old mobile phones than from one ton of gold ore.'
  },
  {
    id: 'tip-11',
    title: 'Cold Water Washing Magic',
    category: 'Energy Saving',
    content: 'About 75% to 90% of all energy your washing machine consumes goes directly towards heating the water. Swapping to a cold water cycle cleans modern fabrics just as well while saving energy.',
    impact: 'Saves household utility bills and cuts grid reliance',
    icon: '🧼',
    funFact: 'Cold washes prevent clothes from shrinking, fading, and releasing microplastics.'
  },
  {
    id: 'tip-12',
    title: 'The Longevity of LED Bulbs',
    category: 'Energy Saving',
    content: 'LED lightbulbs consume 75% to 80% less electrical energy than traditional incandescent bulbs and last up to 25 times longer. Replacing your highest-use lights with LEDs is highly cost-effective.',
    impact: 'Cuts household lighting energy consumption immediately',
    icon: '💡',
    funFact: 'If everyone in the world switched to LEDs, global CO2 emissions would drop by hundreds of millions of tons.'
  },
  {
    id: 'tip-13',
    title: 'Swap Cling Wrap for Beeswax Wraps',
    category: 'Waste Reduction',
    content: 'Ditch single-use plastic cling wrap for beeswax or silicone wraps. They are organic, washable, reusable, fully biodegradable, and their natural antibacterial properties keep food fresh longer.',
    impact: 'Cuts down non-recyclable microplastic trash',
    icon: '🐝',
    funFact: 'Beeswax wraps can be washed with cold water and reused for up to an entire year!'
  },
  {
    id: 'tip-14',
    title: 'Infinitely Recyclable Glass',
    category: 'Recycling Trivia',
    content: 'Like aluminium, glass can be recycled endlessly without any loss in purity or strength. Making new glass from crushed recycled glass (called "cullet") requires much lower furnace temperatures.',
    impact: 'Preserves natural river sands and cuts carbon emissions',
    icon: '🍾',
    funFact: 'A glass bottle discarded in a landfill will take over 1 million years to fully degrade!'
  },
  {
    id: 'tip-15',
    title: 'Regrow Your Own Kitchen Veggies',
    category: 'Waste Reduction',
    content: 'You can easily regrow certain kitchen scraps! Place the bottom root base of spring onions, celery, leeks, or romaine lettuce in a small bowl of shallow water on a sunny windowsill, and watch them sprout new shoots.',
    impact: 'Reduces grocery packaging and transportation footprint',
    icon: '🌱',
    funFact: 'Spring onions are the fastest! You will see fresh green shoots growing within 24 hours.'
  },
  {
    id: 'tip-16',
    title: 'Solid Bars Over Liquid Bottles',
    category: 'Waste Reduction',
    content: 'Swap bottled liquid body washes, shampoo, and conditioners for solid bars. They contain no added water, require much less protective packaging (usually compostable cardboard), and last longer.',
    impact: 'Eliminates bulky plastic bottle waste in bathrooms',
    icon: '🧼',
    funFact: 'Standard liquid shampoo is 80% water. You are essentially paying to ship heavy water in plastic!'
  },
  {
    id: 'tip-17',
    title: 'Secondhand Denim Savings',
    category: 'Water Conservation',
    content: 'Manufacturing a single new pair of denim jeans requires a staggering amount of water due to cotton cultivation and chemical dyeing. Try shopping secondhand or thrifted denim to extend clothing lifespans.',
    impact: 'Conserves precious freshwater ecosystems',
    icon: '👖',
    funFact: 'It takes up to 10,000 liters of water to produce just one single pair of new denim jeans!'
  },
  {
    id: 'tip-18',
    title: 'Computers Need True Sleep',
    category: 'Energy Saving',
    content: 'Moving screensavers do not save power; they keep the graphics card and monitor operating at high capacity. Set your laptop to automatically enter "Sleep" or "Hibernate" mode after 5 minutes of inactivity.',
    impact: 'Prolongs battery health and cuts quiet carbon draw',
    icon: '🖥️',
    funFact: 'Putting your computer to sleep cuts its electrical power consumption to less than 2 watts.'
  },
  {
    id: 'tip-19',
    title: 'Composting Organic Methane Killers',
    category: 'Waste Reduction',
    content: 'When organic waste like vegetable skins or fruit cores are thrown in standard garbage bags, they rot under mountains of trash without oxygen, creating methane gas. Composting allows oxygen-based decay, avoiding methane.',
    impact: 'Curbs powerful greenhouse gas build-ups in landfills',
    icon: '🍎',
    funFact: 'Methane gas is up to 80 times more potent at trapping atmosphere heat than carbon dioxide.'
  },
  {
    id: 'tip-20',
    title: 'Double-Sided Printing Default',
    category: 'Civic Duty',
    content: 'Set your home or office printer defaults to "Double-Sided" (Duplex) printing. This immediately halves paper usage, protecting forest cover and minimizing raw wood pulp demand.',
    impact: 'Halves household paper expenses and paper waste volume',
    icon: '🖨️',
    funFact: 'The average office worker goes through approximately 10,000 sheets of copier paper every year.'
  },
  {
    id: 'tip-21',
    title: 'Sustainably Dry Your Clothes',
    category: 'Energy Saving',
    content: 'Dryers are one of the most power-hungry household appliances. Whenever possible, dry your garments on an indoor drying rack or outdoor washing line. It is completely free and much gentler on fabrics.',
    impact: 'Extends clothes lifespan and saves monthly energy costs',
    icon: '👕',
    funFact: 'Air-drying garments completely avoids the static electricity and friction that thins fabrics.'
  },
  {
    id: 'tip-22',
    title: 'Stop the Plastic Straw Torrent',
    category: 'Waste Reduction',
    content: 'Plastic straws are too small and lightweight to be sorted by recycling machinery, so they fall through screens and contaminate other materials or get sent straight to landfills, rivers, and oceans.',
    impact: 'Protects delicate marine wildlife',
    icon: '🥤',
    funFact: 'Over 500 million plastic straws are estimated to be used and discarded daily in some developed countries.'
  },
  {
    id: 'tip-23',
    title: 'Watering Under the Cool Sun',
    category: 'Water Conservation',
    content: 'Water your lawn or balcony plants during the cool early morning or late evening hours. Watering during the hot midday sun causes up to 30% of the water to evaporate before the soil can absorb it.',
    impact: 'Reduces water bills and improves plant hydration',
    icon: '🚿',
    funFact: 'Plants watered in the morning are also far less susceptible to leaf-molding and root fungi.'
  },
  {
    id: 'tip-24',
    title: 'The Heavy Power of Recycling Steel',
    category: 'Recycling Trivia',
    content: 'Recycling steel and iron saves 75% of the energy needed to refine crude iron ore. Steel is the most recycled material in the world, maintaining its magnetic properties throughout recycling.',
    impact: 'Limits invasive industrial ore mining',
    icon: '⚙️',
    funFact: 'For every ton of steel recycled, 1.1 tons of iron ore and 630 kg of coal are conserved!'
  },
  {
    id: 'tip-25',
    title: 'Rainwater Garden Harvesting',
    category: 'Water Conservation',
    content: 'Position a rain barrel under your house gutter downspouts to collect pure rainwater. This water is excellent for houseplants and outdoor gardens as it is free of public chlorine and fluoride.',
    impact: 'Minimizes municipal treated tap water usage',
    icon: '🌧️',
    funFact: 'A single heavy rain shower on a standard house roof can yield over 1,000 liters of harvestable water!'
  },
  {
    id: 'tip-26',
    title: 'The Great Ocean Garbage Patch',
    category: 'Recycling Trivia',
    content: 'Much of the plastic discarded on land finds its way through storm drains and rivers into oceans, forming giant circulating gyres. Sorting and recycling plastic prevents it from joining these toxic fields.',
    impact: 'Keeps plastic particles out of the human food chain',
    icon: '🌊',
    funFact: 'The Great Pacific Garbage Patch is currently estimated to be twice the geographical size of Texas!'
  },
  {
    id: 'tip-27',
    title: 'Bring Reusable Cutlery to Takeouts',
    category: 'Waste Reduction',
    content: 'Decline plastic knives, forks, and spoons when ordering takeaway meals to eat at home or in the office. Keep a reusable bamboo or stainless-steel utensil travel kit in your everyday backpack.',
    impact: 'Keeps sharp, unrecyclable plastic utensils out of landfills',
    icon: '🍴',
    funFact: 'Single-use plastic cutlery is virtually never recycled due to its light weight and low resin value.'
  },
  {
    id: 'tip-28',
    title: 'A Single Bottle\'s Lifetime',
    category: 'Recycling Trivia',
    content: 'A standard PET plastic drinking bottle takes up to 450-500 years to slowly break down in a landfill, and even then, it only fragments into microscopic toxic microplastics that remain in the soil forever.',
    impact: 'Encourages reusable flasks like stainless steel',
    icon: '🍼',
    funFact: 'Recycling a single plastic bottle saves enough energy to run a laptop computer for up to 30 minutes!'
  },
  {
    id: 'tip-29',
    title: 'Buy Refill Packs',
    category: 'Waste Reduction',
    content: 'For household detergents, hand washes, and spices, purchase large flexible pouch "refills" instead of buying new hard plastic pumps each time. You can refill your existing glass or plastic pumps easily.',
    impact: 'Saves up to 80% of packaging plastic weight per purchase',
    icon: '🧴',
    funFact: 'Flexible refill pouches use significantly less energy and greenhouse gas emissions to manufacture and ship.'
  },
  {
    id: 'tip-30',
    title: 'The Microfiber Filter Guard',
    category: 'Water Conservation',
    content: 'Synthetic clothes (polyester, nylon, acrylic) shed hundreds of thousands of microscopic plastic fibers during a single wash. Using a microfiber filter attachment on your washing machine traps them before they enter rivers.',
    impact: 'Shields marine life from swallowing microscopic plastic fibers',
    icon: '🐟',
    funFact: 'Microplastic fibers from synthetic clothing represent over 35% of all microplastics found in our oceans.'
  }
];
