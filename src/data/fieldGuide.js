// The Field Guide: a manageable set of 100 things we are confident the
// app can recognise. Used for the "X / 100 DISCOVERED" goal and as the
// offline/demo fallback. AI identifications outside this list still count
// as discoveries — they just don't fill a Field Guide slot.
//
// [commonName, scientificName, category, rarity(1-5), region]

const RAW = [
  // 🌳 Plants & trees (30)
  ['Indian Banyan', 'Ficus benghalensis', 'plant', 2, 'Native to India'],
  ['Peepal Tree', 'Ficus religiosa', 'plant', 2, 'Native to Indian subcontinent'],
  ['Neem', 'Azadirachta indica', 'plant', 1, 'Native to India'],
  ['Mango Tree', 'Mangifera indica', 'plant', 1, 'Native to South Asia'],
  ['Ashoka Tree', 'Saraca asoca', 'plant', 3, 'Native to India'],
  ['False Ashoka', 'Monoon longifolium', 'plant', 1, 'Native to India & Sri Lanka'],
  ['Jamun', 'Syzygium cumini', 'plant', 2, 'Native to Indian subcontinent'],
  ['Arjun Tree', 'Terminalia arjuna', 'plant', 3, 'Native to India'],
  ['Indian Rosewood', 'Dalbergia sissoo', 'plant', 2, 'Native to Indian subcontinent'],
  ['Eucalyptus', 'Eucalyptus globulus', 'plant', 1, 'Native to Australia'],
  ['Coconut Palm', 'Cocos nucifera', 'plant', 1, 'Tropical coasts worldwide'],
  ['Banana Plant', 'Musa acuminata', 'plant', 1, 'Native to Southeast Asia'],
  ['Tulsi (Holy Basil)', 'Ocimum tenuiflorum', 'plant', 1, 'Native to Indian subcontinent'],
  ['Aloe Vera', 'Aloe barbadensis miller', 'plant', 1, 'Native to Arabian Peninsula'],
  ['Money Plant', 'Epipremnum aureum', 'plant', 1, 'Native to French Polynesia'],
  ['Snake Plant', 'Dracaena trifasciata', 'plant', 1, 'Native to West Africa'],
  ['Bamboo', 'Bambusa vulgaris', 'plant', 2, 'Native to Asia'],
  ['Curry Leaf Tree', 'Murraya koenigii', 'plant', 2, 'Native to India'],
  ['Moringa', 'Moringa oleifera', 'plant', 2, 'Native to India'],
  ['Tamarind', 'Tamarindus indica', 'plant', 2, 'Native to tropical Africa'],
  ['Banyan Fig (Weeping)', 'Ficus benjamina', 'plant', 1, 'Native to Asia & Australia'],
  ['Rubber Plant', 'Ficus elastica', 'plant', 1, 'Native to South & Southeast Asia'],
  ['Oak', 'Quercus robur', 'plant', 2, 'Native to Europe'],
  ['Maple', 'Acer saccharum', 'plant', 2, 'Native to North America'],
  ['Pine', 'Pinus sylvestris', 'plant', 2, 'Native to Eurasia'],
  ['Common Fern', 'Polypodium vulgare', 'plant', 2, 'Widespread'],
  ['Moss', 'Bryophyta', 'plant', 1, 'Worldwide'],
  ['Prickly Pear Cactus', 'Opuntia ficus-indica', 'plant', 2, 'Native to Mexico'],
  ['Lantana', 'Lantana camara', 'plant', 1, 'Native to the Americas'],
  ['Mimosa (Touch-me-not)', 'Mimosa pudica', 'plant', 3, 'Native to the Americas'],

  // 🌸 Flowers (20)
  ['Hibiscus', 'Hibiscus rosa-sinensis', 'flower', 1, 'Native to East Asia'],
  ['Marigold', 'Tagetes erecta', 'flower', 1, 'Native to the Americas'],
  ['Bougainvillea', 'Bougainvillea glabra', 'flower', 1, 'Native to South America'],
  ['Rose', 'Rosa indica', 'flower', 1, 'Worldwide (cultivated)'],
  ['Jasmine', 'Jasminum sambac', 'flower', 2, 'Native to South Asia'],
  ['Frangipani', 'Plumeria rubra', 'flower', 2, 'Native to Central America'],
  ['Lotus', 'Nelumbo nucifera', 'flower', 3, 'Native to Asia'],
  ['Water Lily', 'Nymphaea nouchali', 'flower', 3, 'Native to South Asia'],
  ['Sunflower', 'Helianthus annuus', 'flower', 2, 'Native to the Americas'],
  ['Periwinkle', 'Catharanthus roseus', 'flower', 1, 'Native to Madagascar'],
  ['Oleander', 'Nerium oleander', 'flower', 1, 'Mediterranean to Asia'],
  ['Flame of the Forest', 'Butea monosperma', 'flower', 4, 'Native to Indian subcontinent'],
  ['Gulmohar', 'Delonix regia', 'flower', 2, 'Native to Madagascar'],
  ['Amaltas (Golden Shower)', 'Cassia fistula', 'flower', 2, 'Native to Indian subcontinent'],
  ['Dandelion', 'Taraxacum officinale', 'flower', 1, 'Native to Eurasia'],
  ['Daisy', 'Bellis perennis', 'flower', 1, 'Native to Europe'],
  ['Morning Glory', 'Ipomoea purpurea', 'flower', 2, 'Native to the Americas'],
  ['Night-flowering Jasmine', 'Nyctanthes arbor-tristis', 'flower', 3, 'Native to South Asia'],
  ['Crown Flower', 'Calotropis gigantea', 'flower', 2, 'Native to South Asia'],
  ['Orchid', 'Orchidaceae', 'flower', 4, 'Worldwide'],

  // 🐦 Birds (20)
  ['House Sparrow', 'Passer domesticus', 'bird', 1, 'Worldwide'],
  ['Common Myna', 'Acridotheres tristis', 'bird', 1, 'Native to Asia'],
  ['Rock Pigeon', 'Columba livia', 'bird', 1, 'Worldwide'],
  ['House Crow', 'Corvus splendens', 'bird', 1, 'Native to South Asia'],
  ['Rose-ringed Parakeet', 'Psittacula krameri', 'bird', 2, 'Native to Africa & South Asia'],
  ['Red-vented Bulbul', 'Pycnonotus cafer', 'bird', 2, 'Native to South Asia'],
  ['Indian Peafowl', 'Pavo cristatus', 'bird', 3, 'Native to Indian subcontinent'],
  ['Black Kite', 'Milvus migrans', 'bird', 2, 'Widespread in Old World'],
  ['Asian Koel', 'Eudynamys scolopaceus', 'bird', 3, 'Native to South Asia'],
  ['Spotted Dove', 'Spilopelia chinensis', 'bird', 2, 'Native to Asia'],
  ['Purple Sunbird', 'Cinnyris asiaticus', 'bird', 3, 'Native to South Asia'],
  ['Indian Robin', 'Copsychus fulicatus', 'bird', 3, 'Native to Indian subcontinent'],
  ['White-throated Kingfisher', 'Halcyon smyrnensis', 'bird', 4, 'Native to Asia'],
  ['Cattle Egret', 'Bubulcus ibis', 'bird', 2, 'Worldwide'],
  ['Red-wattled Lapwing', 'Vanellus indicus', 'bird', 3, 'Native to South Asia'],
  ['Coppersmith Barbet', 'Psilopogon haemacephalus', 'bird', 4, 'Native to South Asia'],
  ['Indian Grey Hornbill', 'Ocyceros birostris', 'bird', 4, 'Native to Indian subcontinent'],
  ['Hoopoe', 'Upupa epops', 'bird', 4, 'Afro-Eurasia'],
  ['Mallard', 'Anas platyrhynchos', 'bird', 2, 'Northern Hemisphere'],
  ['European Robin', 'Erithacus rubecula', 'bird', 3, 'Native to Europe'],

  // 🦋 Insects (15)
  ['Plain Tiger Butterfly', 'Danaus chrysippus', 'insect', 2, 'Asia, Africa, Australia'],
  ['Common Mormon', 'Papilio polytes', 'insect', 3, 'Native to Asia'],
  ['Lime Butterfly', 'Papilio demoleus', 'insect', 2, 'Asia & Australia'],
  ['Monarch Butterfly', 'Danaus plexippus', 'insect', 3, 'Native to the Americas'],
  ['Honey Bee', 'Apis mellifera', 'insect', 1, 'Worldwide'],
  ['Carpenter Bee', 'Xylocopa violacea', 'insect', 2, 'Worldwide'],
  ['Seven-spot Ladybird', 'Coccinella septempunctata', 'insect', 2, 'Eurasia'],
  ['Dragonfly', 'Anisoptera', 'insect', 2, 'Worldwide'],
  ['Damselfly', 'Zygoptera', 'insect', 3, 'Worldwide'],
  ['Praying Mantis', 'Mantis religiosa', 'insect', 4, 'Worldwide'],
  ['Grasshopper', 'Caelifera', 'insect', 1, 'Worldwide'],
  ['Red Weaver Ant', 'Oecophylla smaragdina', 'insect', 2, 'Asia & Australia'],
  ['Firefly', 'Lampyridae', 'insect', 4, 'Worldwide'],
  ['Cicada', 'Cicadidae', 'insect', 3, 'Worldwide'],
  ['Jewel Beetle', 'Buprestidae', 'insect', 5, 'Worldwide'],

  // 🍄 Fungi (5)
  ['Bracket Fungus', 'Ganoderma applanatum', 'mushroom', 3, 'Worldwide'],
  ['Button Mushroom', 'Agaricus bisporus', 'mushroom', 2, 'Worldwide'],
  ['Oyster Mushroom', 'Pleurotus ostreatus', 'mushroom', 3, 'Worldwide'],
  ['Fly Agaric', 'Amanita muscaria', 'mushroom', 5, 'Northern Hemisphere'],
  ['Lichen', 'Lichenes', 'mushroom', 2, 'Worldwide'],

  // 🪨 Rocks (5)
  ['Granite', 'Igneous rock', 'rock', 1, 'Worldwide'],
  ['Sandstone', 'Sedimentary rock', 'rock', 1, 'Worldwide'],
  ['Quartz', 'Silicon dioxide', 'rock', 2, 'Worldwide'],
  ['Basalt', 'Igneous rock', 'rock', 2, 'Worldwide'],
  ['Marble', 'Metamorphic rock', 'rock', 3, 'Worldwide'],

  // 🐿️ Animals (5)
  ['Indian Palm Squirrel', 'Funambulus palmarum', 'animal', 1, 'Native to India & Sri Lanka'],
  ['Garden Lizard', 'Calotes versicolor', 'animal', 2, 'Native to Asia'],
  ['Rhesus Macaque', 'Macaca mulatta', 'animal', 2, 'Native to Asia'],
  ['Common Toad', 'Duttaphrynus melanostictus', 'animal', 3, 'Native to South Asia'],
  ['Garden Snail', 'Cornu aspersum', 'animal', 1, 'Worldwide'],
];

export const FIELD_GUIDE = RAW.map(([name, scientific, category, rarity, region]) => ({
  id: speciesKey(name, scientific),
  name,
  scientific,
  category,
  rarity,
  region,
}));

export const FIELD_GUIDE_SIZE = FIELD_GUIDE.length;

/** Normalised key: one species = one Pokédex entry. */
export function speciesKey(name = '', scientific = '') {
  const s = (scientific || '').toLowerCase().replace(/[^a-z]/g, '');
  // Generic descriptors like "igneous rock" aren't unique; use the common name then.
  if (s && !/rock$/.test(s) && s.length > 4) return s;
  return (name || '').toLowerCase().replace(/[^a-z]/g, '');
}

/** Find the Field Guide entry matching an AI result (by scientific or common name). */
export function matchFieldGuide(name, scientific) {
  const key = speciesKey(name, scientific);
  const byKey = FIELD_GUIDE.find((s) => s.id === key);
  if (byKey) return byKey;
  const n = (name || '').toLowerCase().trim();
  return FIELD_GUIDE.find((s) => s.name.toLowerCase() === n) || null;
}
