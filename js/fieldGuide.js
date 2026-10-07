// WildDex — Field Guide Database (100 Species across categories)
// One species = one Pokédex entry.

export const categoryMeta = {
  plant: { emoji: '🌳', label: 'Plants', singular: 'Plant', color: '#7CF29A' },
  flower: { emoji: '🌸', label: 'Flowers', singular: 'Flower', color: '#FF8FC7' },
  bird: { emoji: '🐦', label: 'Birds', singular: 'Bird', color: '#6CC7FF' },
  insect: { emoji: '🦋', label: 'Insects', singular: 'Insect', color: '#B79CFF' },
  mushroom: { emoji: '🍄', label: 'Fungi', singular: 'Fungus', color: '#FF9F6B' },
  rock: { emoji: '🪨', label: 'Rocks', singular: 'Rock', color: '#C9B79C' },
  animal: { emoji: '🐿️', label: 'Animals', singular: 'Animal', color: '#FFC857' },
  other: { emoji: '✨', label: 'Others', singular: 'Discovery', color: '#9DB7A8' }
};

export const RAW_SPECIES = [
  // 🌳 Plants & Trees (30)
  ['Indian Banyan', 'Ficus benghalensis', 'plant', 3, 'Native to Indian Subcontinent', 'National tree of India with sprawling aerial prop roots that can live for centuries.'],
  ['Peepal Tree', 'Ficus religiosa', 'plant', 2, 'Native to Indian subcontinent', 'Sacred fig tree known for heart-shaped leaves with distinctive elongated tips.'],
  ['Neem', 'Azadirachta indica', 'plant', 1, 'Native to India', 'Fast-growing mahogany known for natural medicinal and insecticidal properties.'],
  ['Mango Tree', 'Mangifera indica', 'plant', 1, 'Native to South Asia', 'Large evergreen fruit tree that can survive over 300 years.'],
  ['Ashoka Tree', 'Saraca asoca', 'plant', 3, 'Native to India', 'Prized rainforest tree with lush foliage and aromatic orange-yellow flowers.'],
  ['False Ashoka', 'Monoon longifolium', 'plant', 1, 'Native to India & Sri Lanka', 'Tall, slender evergreen with weeping pendulous branches often lined along avenues.'],
  ['Jamun', 'Syzygium cumini', 'plant', 2, 'Native to Indian subcontinent', 'Evergreen tropical tree producing deep purple, sweet-tart summer berries.'],
  ['Arjun Tree', 'Terminalia arjuna', 'plant', 3, 'Native to India', 'Majestic riverbank tree recognized by smooth grey flaking bark.'],
  ['Indian Rosewood', 'Dalbergia sissoo', 'plant', 2, 'Native to Indian subcontinent', 'Hardy hardwood tree with delicate pinnate leaves and fragrant flowers.'],
  ['Eucalyptus', 'Eucalyptus globulus', 'plant', 1, 'Native to Australia', 'Aromatic tree with peeling bark and distinctive menthol-scented leaves.'],
  ['Coconut Palm', 'Cocos nucifera', 'plant', 1, 'Tropical coasts worldwide', 'Tall leaning palm producing hard-shelled coconuts that disperse across oceans.'],
  ['Banana Plant', 'Musa acuminata', 'plant', 1, 'Native to Southeast Asia', 'Giant herbaceous plant with immense paddle-shaped leaves.'],
  ['Tulsi (Holy Basil)', 'Ocimum tenuiflorum', 'plant', 1, 'Native to Indian subcontinent', 'Aromatic sacred herb with purple-tinged blossoms found across courtyards.'],
  ['Aloe Vera', 'Aloe barbadensis miller', 'plant', 1, 'Native to Arabian Peninsula', 'Succulent with thick fleshy serrated leaves containing soothing gel.'],
  ['Money Plant', 'Epipremnum aureum', 'plant', 1, 'Native to French Polynesia', 'Trailing vine with heart-shaped leaves marbled with golden-yellow patches.'],
  ['Snake Plant', 'Dracaena trifasciata', 'plant', 1, 'Native to West Africa', 'Hardy architectural plant with stiff upright sword-like variegated leaves.'],
  ['Bamboo', 'Bambusa vulgaris', 'plant', 2, 'Native to Asia', 'Fastest-growing woody grass on Earth, capable of growing nearly 1 meter per day.'],
  ['Curry Leaf Tree', 'Murraya koenigii', 'plant', 2, 'Native to India', 'Aromatic citrus-family bush whose fragrant leaves are essential in Indian cooking.'],
  ['Moringa', 'Moringa oleifera', 'plant', 2, 'Native to India', 'Fast-growing "drumstick tree" packed with vitamins across leaves, pods, and seeds.'],
  ['Tamarind', 'Tamarindus indica', 'plant', 2, 'Native to tropical Africa', 'Massive slow-growing tree yielding pod fruit used for tangy cooking.'],
  ['Weeping Fig', 'Ficus benjamina', 'plant', 1, 'Native to Asia & Australia', 'Graceful tree with arching twigs and glossy oval leaves.'],
  ['Rubber Plant', 'Ficus elastica', 'plant', 1, 'Native to South & Southeast Asia', 'Sturdy banyan fig producing latex sap and broad leathery deep-green leaves.'],
  ['Oak', 'Quercus robur', 'plant', 2, 'Native to Europe', 'Stately deciduous giant producing acorns and deeply lobed leaves.'],
  ['Maple', 'Acer saccharum', 'plant', 2, 'Native to North America', 'Hardwood celebrated for fiery autumn foliage and winged samara seeds.'],
  ['Pine', 'Pinus sylvestris', 'plant', 2, 'Native to Eurasia', 'Resinous evergreen conifer carrying clustered needles and protective cones.'],
  ['Common Fern', 'Polypodium vulgare', 'plant', 2, 'Widespread', 'Ancient spore-bearing vascular plant thriving in shaded, moist woodlands.'],
  ['Velvet Moss', 'Bryophyta', 'plant', 1, 'Worldwide', 'Non-vascular carpet plant that absorbs water directly through tiny leafy scales.'],
  ['Prickly Pear Cactus', 'Opuntia ficus-indica', 'plant', 2, 'Native to Mexico', 'Drought-tolerant succulent composed of flat paddle stems studded with glochids.'],
  ['Lantana', 'Lantana camara', 'plant', 1, 'Native to the Americas', 'Perennial flowering shrub with clusters of tiny multicoloured flowers.'],
  ['Mimosa (Touch-me-not)', 'Mimosa pudica', 'plant', 3, 'Native to the Americas', 'Sensitive creeping herb that rapidly folds inward upon touch or breeze.'],

  // 🌸 Flowers (20)
  ['Hibiscus', 'Hibiscus rosa-sinensis', 'flower', 1, 'Native to East Asia', 'Showy trumpet flower with a long prominent staminal column.'],
  ['Marigold', 'Tagetes erecta', 'flower', 1, 'Native to the Americas', 'Vibrant golden pom-pom blooms used widely in festive Indian garlands.'],
  ['Bougainvillea', 'Bougainvillea glabra', 'flower', 1, 'Native to South America', 'Thorny woody vine draped in papery vibrant magenta bracts.'],
  ['Rose', 'Rosa indica', 'flower', 1, 'Worldwide', 'Classic fragrant floral perennial with thorny stems and layered petal whorls.'],
  ['Jasmine', 'Jasminum sambac', 'flower', 2, 'Native to South Asia', 'Intensely fragrant white star flowers opening at dusk.'],
  ['Frangipani', 'Plumeria rubra', 'flower', 2, 'Native to Central America', 'Thick-branched temple tree with spiral spiral-petaled yellow-white blooms.'],
  ['Indian Lotus', 'Nelumbo nucifera', 'flower', 3, 'Native to Asia', 'Sacred aquatic perennial rising untainted above muddy freshwater.'],
  ['Water Lily', 'Nymphaea nouchali', 'flower', 3, 'Native to South Asia', 'Floating star-shaped blossom cradled on round waxy pads.'],
  ['Sunflower', 'Helianthus annuus', 'flower', 2, 'Native to the Americas', 'Heliotropic giant whose massive golden flower heads track the sun across the sky.'],
  ['Periwinkle', 'Catharanthus roseus', 'flower', 1, 'Native to Madagascar', 'Resilient five-lobed pink or white flower that blooms year-round.'],
  ['Oleander', 'Nerium oleander', 'flower', 1, 'Mediterranean to Asia', 'Hardy evergreen shrub with clusters of pink or white flowers and willow-like foliage.'],
  ['Flame of the Forest', 'Butea monosperma', 'flower', 4, 'Native to Indian subcontinent', 'Spectacular vermillion blooms appearing before leaves in early spring.'],
  ['Gulmohar', 'Delonix regia', 'flower', 2, 'Native to Madagascar', 'Flamboyant ornamental canopy exploding with fiery orange-red petals in summer.'],
  ['Amaltas (Golden Shower)', 'Cassia fistula', 'flower', 2, 'Native to Indian subcontinent', 'Deciduous tree draped in cascading pendulous bunches of pure yellow blossoms.'],
  ['Dandelion', 'Taraxacum officinale', 'flower', 1, 'Native to Eurasia', 'Bright yellow ray flower transforming into a delicate spherical seed puffball.'],
  ['English Daisy', 'Bellis perennis', 'flower', 1, 'Native to Europe', 'Charming low-growing composite bloom with white rays around a bright yellow disc.'],
  ['Morning Glory', 'Ipomoea purpurea', 'flower', 2, 'Native to the Americas', 'Climbing vine with delicate funnel-shaped blooms that open only in early morning.'],
  ['Night-flowering Jasmine', 'Nyctanthes arbor-tristis', 'flower', 3, 'Native to South Asia', 'Parijat blossom with sparkling white petals and a bright orange coral stem.'],
  ['Crown Flower', 'Calotropis gigantea', 'flower', 2, 'Native to South Asia', 'Desert milkweed bearing waxen lavender star flowers with an intricate crown center.'],
  ['Wild Orchid', 'Orchidaceae', 'flower', 4, 'Worldwide', 'Complex asymmetric blossom evolved for specialized pollinator deception and attraction.'],

  // 🐦 Birds (20)
  ['House Sparrow', 'Passer domesticus', 'bird', 1, 'Worldwide', 'Social city dweller with streaked brown plumage and lively chirping calls.'],
  ['Common Myna', 'Acridotheres tristis', 'bird', 1, 'Native to Asia', 'Bold brown starling with bright yellow eye patches and charismatic vocal mimicry.'],
  ['Rock Pigeon', 'Columba livia', 'bird', 1, 'Worldwide', 'Ubiquitous iridescent city bird that navigates using Earth’s magnetic fields.'],
  ['House Crow', 'Corvus splendens', 'bird', 1, 'Native to South Asia', 'Intelligent grey-collared crow with exceptional problem-solving cognition.'],
  ['Rose-ringed Parakeet', 'Psittacula krameri', 'bird', 2, 'Native to Africa & South Asia', 'Vibrant emerald parakeet with a hooked red bill and loud screeches.'],
  ['Red-vented Bulbul', 'Pycnonotus cafer', 'bird', 2, 'Native to South Asia', 'Crested garden singer distinguished by a bright ruby-red patch under the tail.'],
  ['Indian Peafowl', 'Pavo cristatus', 'bird', 3, 'Native to Indian subcontinent', 'National bird of India; male displays an iridescent train of eye-spotted feathers.'],
  ['Black Kite', 'Milvus migrans', 'bird', 2, 'Widespread in Old World', 'Master aerial soaring raptor easily recognized by its forked steering tail.'],
  ['Asian Koel', 'Eudynamys scolopaceus', 'bird', 3, 'Native to South Asia', 'Secretive glossy-black cuckoo with fiery red eyes and a ringing "ko-ooo" dawn call.'],
  ['Spotted Dove', 'Spilopelia chinensis', 'bird', 2, 'Native to Asia', 'Gentle grey-brown dove boasting a white-spotted black chessboard collar.'],
  ['Purple Sunbird', 'Cinnyris asiaticus', 'bird', 3, 'Native to South Asia', 'Tiny jewel bird with curved beak adapted to hover and sip nectar from flowers.'],
  ['Indian Robin', 'Copsychus fulicatus', 'bird', 3, 'Native to Indian subcontinent', 'Cocky black bird that frequently perches with its upright tail cocked.'],
  ['White-throated Kingfisher', 'Halcyon smyrnensis', 'bird', 4, 'Native to Asia', 'Striking turquoise and chocolate kingfisher with a massive coral-red bill.'],
  ['Cattle Egret', 'Bubulcus ibis', 'bird', 2, 'Worldwide', 'Pristine white wading bird often seen foraging for insects alongside grazing livestock.'],
  ['Red-wattled Lapwing', 'Vanellus indicus', 'bird', 3, 'Native to South Asia', 'Ground-nesting plover famous for its vigilant nocturnal "did-he-do-it" alarm calls.'],
  ['Coppersmith Barbet', 'Psilopogon haemacephalus', 'bird', 4, 'Native to South Asia', 'Small green barbet whose metallic rhythmic call resembles a coppersmith striking metal.'],
  ['Indian Grey Hornbill', 'Ocyceros birostris', 'bird', 4, 'Native to Indian subcontinent', 'Canopy fruit-eater with a curved beak topped by a sharp casque.'],
  ['Hoopoe', 'Upupa epops', 'bird', 4, 'Afro-Eurasia', 'Unmistakable cinnamon bird featuring a dramatic erectile crest and striped zebra wings.'],
  ['Mallard', 'Anas platyrhynchos', 'bird', 2, 'Northern Hemisphere', 'Dabbling duck; the male sports a shimmering iridescent bottle-green head.'],
  ['European Robin', 'Erithacus rubecula', 'bird', 3, 'Native to Europe', 'Plump woodland songbird with an iconic bright orange-red breast and curious nature.'],

  // 🦋 Insects (15)
  ['Plain Tiger Butterfly', 'Danaus chrysippus', 'insect', 2, 'Asia, Africa, Australia', 'Tawny orange butterfly with black white-spotted margins, unpalatable to birds.'],
  ['Common Mormon', 'Papilio polytes', 'insect', 3, 'Native to Asia', 'Jet-black swallowtail with ruby spots whose females mimic toxic species.'],
  ['Lime Butterfly', 'Papilio demoleus', 'insect', 2, 'Asia & Australia', 'Tailless swallowtail adorned in intricate yellow and black checkered mosaic patterns.'],
  ['Monarch Butterfly', 'Danaus plexippus', 'insect', 3, 'Native to Americas', 'Famous long-distance migratory butterfly guided by polarized light and magnetic fields.'],
  ['Honey Bee', 'Apis mellifera', 'insect', 1, 'Worldwide', 'Vital pollinator communicating floral directions through an intricate "waggle dance".'],
  ['Carpenter Bee', 'Xylocopa violacea', 'insect', 2, 'Worldwide', 'Massive solitary black bee with shimmering violet wings that burrows in dead timber.'],
  ['Seven-spot Ladybird', 'Coccinella septempunctata', 'insect', 2, 'Eurasia', 'Beneficial garden beetle with bright red wing covers bearing seven black dots.'],
  ['Globe Skimmer Dragonfly', 'Pantala flavescens', 'insect', 2, 'Worldwide', 'Agile aerial predator capable of trans-oceanic migrations across thousands of miles.'],
  ['Damselfly', 'Zygoptera', 'insect', 3, 'Worldwide', 'Delicate needle-bodied hunter that folds its translucent wings along its back at rest.'],
  ['Praying Mantis', 'Mantis religiosa', 'insect', 4, 'Worldwide', 'Patient ambush predator with spiked raptorial forelegs and 360-degree vision.'],
  ['Grasshopper', 'Caelifera', 'insect', 1, 'Worldwide', 'Powerful jumping insect that produces summer chirps by rubbing hind legs against wings.'],
  ['Red Weaver Ant', 'Oecophylla smaragdina', 'insect', 2, 'Asia & Australia', 'Arboreal ant that weaves living leaf nests using silk produced by its own larvae.'],
  ['Firefly', 'Lampyridae', 'insect', 4, 'Worldwide', 'Bioluminescent beetle that flashes cold rhythmic light signals to attract mates in summer nights.'],
  ['Cicada', 'Cicadidae', 'insect', 3, 'Worldwide', 'Acoustic marvel producing high-decibel summer buzzes through vibrating abdominal tymbals.'],
  ['Jewel Beetle', 'Buprestidae', 'insect', 5, 'Worldwide', 'Spectacular beetle covered in metallic shimmering iridescence resembling polished emerald.'],

  // 🍄 Fungi (5)
  ['Bracket Fungus', 'Ganoderma applanatum', 'mushroom', 3, 'Worldwide', 'Hard woody shelf fungus that grows horizontally from tree trunks, recording rings of age.'],
  ['Button Mushroom', 'Agaricus bisporus', 'mushroom', 2, 'Worldwide', 'Common edible umbrella fungus with earthy caps that darken as gills mature.'],
  ['Oyster Mushroom', 'Pleurotus ostreatus', 'mushroom', 3, 'Worldwide', 'Fan-shaped cluster fungus that decomposes decaying wood in moist forests.'],
  ['Fly Agaric', 'Amanita muscaria', 'mushroom', 5, 'Northern Hemisphere', 'Iconic fairy-tale red cap dotted with white warts, highly toxic.'],
  ['Crustose Lichen', 'Lichenes', 'mushroom', 2, 'Worldwide', 'Symbiotic partnership between fungi and algae painted across bare rocks.'],

  // 🪨 Rocks (5)
  ['Granite', 'Plutonic Igneous Rock', 'rock', 1, 'Worldwide', 'Coarse-grained crystalline rock formed from slowly cooled underground magma, rich in quartz and feldspar.'],
  ['Sandstone', 'Sedimentary Rock', 'rock', 1, 'Worldwide', 'Layered mineral rock composed of cemented mineral particles and ancient river sand.'],
  ['Quartz Crystal', 'Silicon dioxide', 'rock', 2, 'Worldwide', 'Hexagonal hard glassy mineral that forms sparkling transparent or milky clusters.'],
  ['Basalt', 'Volcanic Rock', 'rock', 2, 'Worldwide', 'Heavy, dark fine-grained volcanic rock formed by rapid cooling of basaltic lava at the surface.'],
  ['Marble', 'Metamorphic Rock', 'rock', 3, 'Worldwide', 'Recrystallized carbonate rock transformed under intense geological heat and pressure.']
];

export const FIELD_GUIDE = RAW_SPECIES.map(([name, scientific, category, rarity, region, fact], index) => ({
  id: speciesKey(name, scientific),
  number: index + 1,
  name,
  scientific,
  category,
  rarity,
  region,
  fact
}));

export const FIELD_GUIDE_COUNT = FIELD_GUIDE.length;

export function speciesKey(name = '', scientific = '') {
  const cleanSci = (scientific || '').toLowerCase().replace(/[^a-z]/g, '');
  if (cleanSci && !cleanSci.endsWith('rock') && cleanSci.length > 4) {
    return cleanSci;
  }
  return (name || '').toLowerCase().replace(/[^a-z]/g, '');
}

export function findFieldGuideMatch(queryName = '', queryScientific = '') {
  const targetKey = speciesKey(queryName, queryScientific);
  const byKey = FIELD_GUIDE.find(s => s.id === targetKey);
  if (byKey) return byKey;

  const qn = queryName.toLowerCase().trim();
  const qs = queryScientific.toLowerCase().trim();

  return FIELD_GUIDE.find(s => {
    const sName = s.name.toLowerCase();
    const sSci = s.scientific.toLowerCase();
    return sName === qn || sSci === qs || sName.includes(qn) || qn.includes(sName);
  }) || null;
}
