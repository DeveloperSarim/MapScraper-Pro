// MapScraper Pro — Real business data via OpenStreetMap Overpass API
// Free, global coverage, no API key required

// ── Category → OSM tag mapping ────────────────────────────────────────────────
window.CATEGORY_OSM_MAP = {
  // Food & Drink
  "Restaurant":           [{ amenity: "restaurant" }],
  "Fast Food":            [{ amenity: "fast_food" }],
  "Cafe":                 [{ amenity: "cafe" }],
  "Coffee Shop":          [{ amenity: "cafe" }],
  "Bar":                  [{ amenity: "bar" }],
  "Pub":                  [{ amenity: "pub" }],
  "Bakery":               [{ shop: "bakery" }],
  "Ice Cream Shop":       [{ amenity: "ice_cream" }],
  "Juice Bar":            [{ amenity: "juice_bar" }],
  "Italian Restaurant":   [{ amenity: "restaurant", cuisine: "italian" }],
  "Indian Restaurant":    [{ amenity: "restaurant", cuisine: "indian" }],
  "Chinese Restaurant":   [{ amenity: "restaurant", cuisine: "chinese" }],
  "Arabic Restaurant":    [{ amenity: "restaurant", cuisine: "arab" }],
  "Lebanese Restaurant":  [{ amenity: "restaurant", cuisine: "lebanese" }],
  "Pakistani Restaurant": [{ amenity: "restaurant", cuisine: "pakistani" }],
  "Seafood Restaurant":   [{ amenity: "restaurant", cuisine: "seafood" }],
  "Pizza Restaurant":     [{ amenity: "restaurant", cuisine: "pizza" }],
  "Sushi Restaurant":     [{ amenity: "restaurant", cuisine: "sushi" }],
  "Burger Restaurant":    [{ amenity: "restaurant", cuisine: "burger" }],
  "Shawarma":             [{ amenity: "fast_food", cuisine: "shawarma" }],
  "Steakhouse":           [{ amenity: "restaurant", cuisine: "steak_house" }],

  // Health & Medical
  "Hospital":             [{ amenity: "hospital" }],
  "Medical Clinic":       [{ amenity: "clinic" }],
  "Doctor":               [{ amenity: "doctors" }],
  "Pharmacy":             [{ amenity: "pharmacy" }],
  "Dentist":              [{ amenity: "dentist" }],
  "Dental Clinic":        [{ amenity: "dentist" }],
  "Veterinary Clinic":    [{ amenity: "veterinary" }],
  "Optician":             [{ shop: "optician" }],
  "Physiotherapy":        [{ healthcare: "physiotherapist" }],
  "Eye Clinic":           [{ healthcare: "ophthalmologist" }],
  "Skin Clinic":          [{ healthcare: "dermatologist" }],
  "Maternity Hospital":   [{ amenity: "hospital" }],
  "Pediatrician":         [{ healthcare: "paediatrician" }],
  "Orthopedic Clinic":    [{ healthcare: "orthopaedist" }],

  // Fitness & Sports
  "Gym":                  [{ leisure: "fitness_centre" }],
  "Yoga Studio":          [{ leisure: "fitness_centre" }],
  "Swimming Pool":        [{ leisure: "swimming_pool" }],
  "Sports Center":        [{ leisure: "sports_centre" }],
  "Spa":                  [{ leisure: "spa" }],
  "Pilates Studio":       [{ leisure: "fitness_centre" }],
  "CrossFit Gym":         [{ leisure: "fitness_centre" }],
  "Martial Arts":         [{ leisure: "martial_arts" }],
  "Tennis Club":          [{ leisure: "pitch", sport: "tennis" }],
  "Football Club":        [{ leisure: "pitch", sport: "football" }],
  "Golf Course":          [{ leisure: "golf_course" }],
  "Cricket Ground":       [{ leisure: "pitch", sport: "cricket" }],

  // Beauty & Personal Care
  "Barber":               [{ shop: "hairdresser" }],
  "Hairdresser":          [{ shop: "hairdresser" }],
  "Beauty Salon":         [{ shop: "beauty" }],
  "Nail Salon":           [{ shop: "beauty" }],
  "Massage Center":       [{ leisure: "spa" }],

  // Shopping
  "Supermarket":          [{ shop: "supermarket" }],
  "Grocery Store":        [{ shop: "convenience" }],
  "Convenience Store":    [{ shop: "convenience" }],
  "Shopping Mall":        [{ shop: "mall" }],
  "Clothing Store":       [{ shop: "clothes" }],
  "Electronics Store":    [{ shop: "electronics" }],
  "Bookstore":            [{ shop: "books" }],
  "Florist":              [{ shop: "florist" }],
  "Jewelry Store":        [{ shop: "jewelry" }],
  "Sporting Goods":       [{ shop: "sports" }],
  "Furniture Store":      [{ shop: "furniture" }],
  "Home Decor":           [{ shop: "houseware" }],
  "Toy Store":            [{ shop: "toys" }],
  "Shoe Store":           [{ shop: "shoes" }],
  "Perfume Store":        [{ shop: "perfumery" }],
  "Mobile Phone Store":   [{ shop: "mobile_phone" }],
  "Baby Store":           [{ shop: "baby_goods" }],

  // Real Estate & Services
  "Real Estate Agency":   [{ office: "estate_agent" }, { office: "real_estate" }, { office: "real_estate_agent" }],
  "Accounting":           [{ office: "accountant" }, { office: "accounting" }],
  "Law Firm":             [{ office: "lawyer" }, { office: "legal" }],
  "Insurance":            [{ office: "insurance" }],
  "Bank":                 [{ amenity: "bank" }],
  "ATM":                  [{ amenity: "atm" }],
  "Post Office":          [{ amenity: "post_office" }],
  "Laundry":              [{ shop: "laundry" }, { amenity: "laundry" }],
  "Car Wash":             [{ amenity: "car_wash" }, { shop: "car_wash" }],
  "Auto Repair":          [{ shop: "car_repair" }, { amenity: "car_repair" }],
  "Gas Station":          [{ amenity: "fuel" }],
  "Photography Studio":   [{ shop: "photo" }, { shop: "photography" }],
  "Tailor":               [{ shop: "tailor" }],
  "Travel Agency":        [{ shop: "travel_agency" }, { office: "travel_agent" }],
  "Currency Exchange":    [{ amenity: "bureau_de_change" }],

  // Education
  "School":               [{ amenity: "school" }],
  "University":           [{ amenity: "university" }],
  "Preschool":            [{ amenity: "kindergarten" }],
  "Nursery":              [{ amenity: "kindergarten" }],
  "Library":              [{ amenity: "library" }],
  "Tutoring Center":      [{ amenity: "school" }],
  "Language School":      [{ amenity: "school" }],
  "Driving School":       [{ amenity: "driving_school" }],

  // Entertainment & Leisure
  "Movie Theater":        [{ amenity: "cinema" }],
  "Museum":               [{ tourism: "museum" }],
  "Park":                 [{ leisure: "park" }],
  "Mosque":               [{ amenity: "place_of_worship", religion: "muslim" }],
  "Church":               [{ amenity: "place_of_worship", religion: "christian" }],
  "Temple":               [{ amenity: "place_of_worship", religion: "hindu" }],
  "Amusement Park":       [{ leisure: "amusement_arcade" }],
  "Bowling Alley":        [{ leisure: "bowling_alley" }],
  "Art Gallery":          [{ tourism: "gallery" }],
  "Stadium":              [{ leisure: "stadium" }],

  // Automotive
  "Car Dealership":       [{ shop: "car" }],
  "Car Rental":           [{ amenity: "car_rental" }],
  "Parking":              [{ amenity: "parking" }],

  // Hospitality
  "Hotel":                [{ tourism: "hotel" }],
  "Resort":               [{ tourism: "resort" }],
  "Hostel":               [{ tourism: "hostel" }],
};

// ── Comprehensive Google Maps–style category groups ───────────────────────────
window.CATEGORY_GROUPS = {
  "🍽️ Food & Drink": [
    "Restaurant","Fast Food","Cafe","Coffee Shop","Bakery","Bar","Pub",
    "Pizza Restaurant","Burger Restaurant","Shawarma","Steakhouse","Grill",
    "Italian Restaurant","Indian Restaurant","Chinese Restaurant","Arabic Restaurant",
    "Lebanese Restaurant","Pakistani Restaurant","Turkish Restaurant","Mexican Restaurant",
    "Thai Restaurant","Korean Restaurant","Japanese Restaurant","French Restaurant",
    "Persian Restaurant","Filipino Restaurant","Vietnamese Restaurant","Greek Restaurant",
    "Seafood Restaurant","Sushi Restaurant","Buffet Restaurant","Food Court",
    "Brunch Restaurant","Breakfast Restaurant","Sandwich Shop","Soup Kitchen",
    "Vegan Restaurant","Vegetarian Restaurant","Organic Restaurant",
    "Ice Cream Shop","Juice Bar","Smoothie Bar","Bubble Tea","Dessert Shop",
    "Donut Shop","Cookie Shop","Chocolate Shop","Candy Store","Cake Shop",
    "Night Club","Cocktail Bar","Wine Bar","Sports Bar","Hookah Lounge","Tea House",
    "Catering Service","Food Truck","Butcher Shop","Fish Market",
  ],
  "🏥 Health & Medical": [
    "Hospital","Medical Clinic","Polyclinic","Urgent Care","Emergency Room",
    "Doctor","General Practitioner","Specialist Doctor",
    "Pharmacy","Drug Store","Medical Supply Store",
    "Dentist","Dental Clinic","Orthodontist","Oral Surgeon",
    "Eye Clinic","Optician","Ophthalmologist","Laser Eye Surgery",
    "Skin Clinic","Dermatologist","Cosmetology Clinic",
    "Physiotherapy","Rehabilitation Center","Occupational Therapy",
    "Orthopedic Clinic","Bone & Joint Clinic",
    "Cardiologist","Heart Center","Cardiology Clinic",
    "Pediatrician","Children's Hospital","Child Health Center",
    "Maternity Hospital","Gynecologist","Obstetrics Clinic","IVF Center","Fertility Clinic",
    "Psychiatrist","Psychologist","Mental Health Clinic","Counseling Center",
    "Neurologist","Neurology Clinic",
    "Oncology Center","Cancer Treatment Center",
    "Dietitian","Nutritionist","Weight Loss Clinic",
    "Audiologist","Hearing Aid Center",
    "Dialysis Center","Kidney Clinic",
    "Medical Laboratory","Blood Test Center","X-Ray Center","MRI Center","CT Scan","Radiology Center",
    "Veterinary Clinic","Pet Hospital","Animal Clinic",
    "Alternative Medicine","Homeopathy","Acupuncture","Cupping Therapy",
  ],
  "💪 Fitness & Sports": [
    "Gym","Fitness Center","Health Club","CrossFit Gym","Functional Fitness",
    "Yoga Studio","Pilates Studio","Meditation Center",
    "Swimming Pool","Aquatic Center",
    "Sports Center","Sports Complex","Sports Club",
    "Martial Arts","Karate","Judo","Boxing Gym","MMA Gym","Taekwondo",
    "Tennis Club","Tennis Court","Squash Club","Badminton Center",
    "Football Club","Football Field","Soccer Academy",
    "Basketball Court","Basketball Club",
    "Golf Course","Golf Club","Driving Range",
    "Cricket Ground","Cricket Club",
    "Cycling Studio","Bicycle Club",
    "Dance Studio","Ballet School","Zumba Class",
    "Rock Climbing","Climbing Gym",
    "Horse Riding","Equestrian Club",
    "Bowling Alley","Skating Rink","Ice Skating","Roller Skating",
    "Running Track","Athletics Club","Triathlon Club",
    "Shooting Range","Archery Range",
    "Paintball","Laser Tag","Trampoline Park",
  ],
  "💄 Beauty & Care": [
    "Beauty Salon","Hair Salon","Hairdresser","Barber","Barber Shop",
    "Nail Salon","Manicure & Pedicure",
    "Spa","Day Spa","Massage Center","Massage Therapist","Thai Massage",
    "Skin Care Clinic","Facial Salon","Laser Hair Removal","Laser Clinic",
    "Waxing Studio","Eyebrow Threading","Eyebrow Shaping",
    "Eyelash Studio","Eyelash Extensions","Microblading",
    "Tattoo Studio","Tattoo & Piercing","Piercing Studio",
    "Makeup Artist","Bridal Makeup","Makeup Studio",
    "Mehndi Studio","Henna Artist",
    "Tanning Studio","Spray Tan",
    "Slimming Center","Body Contouring","Liposuction Clinic",
  ],
  "🛍️ Shopping": [
    "Supermarket","Hypermarket","Grocery Store","Mini Mart","Convenience Store",
    "Shopping Mall","Department Store","Outlet Store","Warehouse Club",
    "Clothing Store","Men's Clothing","Women's Clothing","Children's Clothing",
    "Formal Wear","Traditional Clothing","Wedding Shop","Lingerie Store","Swimwear Store",
    "Shoe Store","Sneaker Store","Sports Shoes",
    "Electronics Store","Computer Store","Mobile Phone Store","Appliance Store",
    "Furniture Store","Home Decor","Interior Design Store","Mattress Store",
    "Jewelry Store","Gold Shop","Diamond Jewelry","Watch Store",
    "Perfume Store","Cosmetics Store","Beauty Supply Store",
    "Bookstore","Stationery Store","Office Supply Store",
    "Toy Store","Baby Store","Children's Store",
    "Sporting Goods","Sports Equipment","Outdoor Store","Camping Store",
    "Florist","Gift Shop","Souvenir Shop",
    "Pet Store","Pet Supply","Aquarium Shop",
    "Optical Store","Eyewear Store",
    "Luggage Store","Bag Store","Leather Goods",
    "Craft Store","Art Supply Store","Hobby Shop",
    "Music Store","Instrument Store",
    "Hardware Store","Tools Store","Building Materials",
    "Paint Store","Wallpaper Store",
    "Fabric Store","Curtain Store","Carpet Store",
    "Party Supply Store","Event Decoration",
    "Second-Hand Store","Thrift Shop","Antique Shop",
    "Wholesale Market","Bulk Store",
  ],
  "🏠 Real Estate": [
    "Real Estate Agency","Real Estate Office","Property Management",
    "Real Estate Developer","Housing Developer","Property Developer",
    "Apartment Complex","Residential Complex","Villa Compound",
    "Commercial Real Estate","Office Space Rental","Co-working Space",
    "Interior Designer","Interior Decorator","Architect","Architecture Firm",
    "Building Contractor","Construction Company","Renovation Contractor",
    "Property Valuation","Real Estate Consultant",
  ],
  "🏦 Finance & Legal": [
    "Bank","Commercial Bank","Islamic Bank","Investment Bank",
    "ATM","Currency Exchange","Money Transfer",
    "Insurance Agency","Car Insurance","Health Insurance","Life Insurance",
    "Financial Advisor","Investment Company","Stock Broker","Wealth Management",
    "Accounting Firm","Auditing Firm","Tax Consultant","Bookkeeper",
    "Law Firm","Lawyer","Legal Consultant","Notary Public","Court",
    "Mortgage Broker","Loan Agency","Microfinance",
  ],
  "🎓 Education": [
    "School","International School","Private School","Islamic School","Public School",
    "University","College","Higher Education","Community College",
    "Kindergarten","Preschool","Nursery","Daycare","Montessori",
    "Tutoring Center","Academic Support","Homework Help",
    "Language School","English Language Center","Arabic Language School",
    "Driving School","Driving Academy",
    "Art School","Music School","Music Academy","Art Academy",
    "Cooking Class","Culinary School",
    "Computer School","Coding Bootcamp","IT Training","Tech Academy",
    "Vocational Training","Skills Training Center","Professional Development",
    "Library","Public Library","Digital Library",
  ],
  "🎭 Entertainment & Culture": [
    "Movie Theater","Cinema","IMAX","Drive-In Theater",
    "Amusement Park","Theme Park","Water Park","Family Entertainment Center",
    "Zoo","Aquarium","Botanical Garden","Nature Reserve",
    "Museum","History Museum","Science Museum","Children's Museum","Art Museum",
    "Art Gallery","Exhibition Center","Cultural Center",
    "Theater","Performing Arts Center","Opera House","Concert Hall",
    "Comedy Club","Stand-Up Comedy","Live Music Venue","Night Club",
    "Arcade","Video Game Center","VR Center","Virtual Reality Arcade",
    "Escape Room","Mini Golf","Go Kart Track","Billiards Room","Pool Hall",
    "Trampoline Park","Indoor Play Area","Children's Play Center",
    "Karaoke","Karaoke Bar",
    "Park","Public Park","Playground","Picnic Area","Waterfront","Corniche",
    "Stadium","Sports Arena","Football Stadium","Cricket Stadium",
    "Horse Racetrack","Formula Racing","Motorsport",
    "Gaming Cafe","Internet Cafe","LAN Center",
  ],
  "🕌 Religious Places": [
    "Mosque","Grand Mosque","Jama Mosque","Local Mosque","Prayer Room",
    "Islamic Center","Quran School","Madrasa","Dawa Center",
    "Church","Cathedral","Chapel","Protestant Church","Catholic Church",
    "Temple","Hindu Temple","Sikh Temple","Buddhist Temple",
    "Synagogue","Jewish Center",
  ],
  "🚗 Automotive": [
    "Car Dealership","New Cars","Used Cars","Car Showroom",
    "Car Rental","Car Leasing","Luxury Car Rental",
    "Auto Repair","Car Workshop","Car Service Center","Engine Repair",
    "Car Wash","Auto Detailing","Car Polishing","Car Coating",
    "Tire Shop","Wheel Alignment","Tire Repair",
    "Oil Change","Lube Center","Oil & Filter Service",
    "Auto Parts","Car Accessories","Car Audio","Tinting Shop",
    "Towing Service","Roadside Assistance",
    "Parking Lot","Parking Garage","Valet Parking",
    "Gas Station","Petrol Station","Fuel Station","EV Charging Station",
    "Windshield Repair","Glass Repair","Auto Body Repair","Dent Removal",
    "Motorcycle Shop","Bike Repair","Motorbike Dealership",
    "Truck Dealership","Commercial Vehicles",
    "Driving School","Road Test Center",
  ],
  "🏨 Hospitality & Travel": [
    "Hotel","Boutique Hotel","Business Hotel","Budget Hotel","Luxury Hotel",
    "Resort","Beach Resort","Mountain Resort","Desert Resort",
    "Hostel","Budget Hostel","Backpacker Hostel",
    "Apartment Hotel","Serviced Apartment","Extended Stay Hotel",
    "Guest House","Bed & Breakfast","Chalet","Villa Rental","Holiday Home","Vacation Rental",
    "Travel Agency","Tour Operator","Tour Guide","City Tours",
    "Airport","Airport Lounge","Airline Office",
    "Train Station","Bus Station","Bus Terminal","Metro Station",
    "Taxi Service","Cab Company","Limousine Service","Shuttle Service",
    "Visa Service","Passport Office","Immigration Service",
  ],
  "🏗️ Home & Professional Services": [
    "Laundry","Dry Cleaning","Laundromat",
    "Cleaning Service","Housekeeping","Maid Service",
    "Pest Control","Fumigation Service","Rodent Control",
    "Plumber","Plumbing Service","Water Heater Repair",
    "Electrician","Electrical Service","Generator Repair",
    "Air Conditioning Repair","HVAC Service","AC Installation",
    "Locksmith","Key Duplication","Safe Installation",
    "Carpenter","Woodwork","Furniture Repair","Upholstery",
    "Painter","House Painting","Commercial Painting",
    "Moving Company","Packing & Moving","Relocation Service",
    "Storage Facility","Self Storage","Warehouse",
    "Photography Studio","Portrait Studio","Product Photography",
    "Videography","Video Production","Film Studio",
    "Printing Service","Copy Shop","Signage","Banner Printing",
    "Tailor","Alteration Service","Embroidery","Uniform Supplier",
    "Security Company","CCTV Installation","Guard Service",
    "Event Planning","Wedding Planner","Party Organizer","Event Venue",
    "Courier Service","Delivery Service","Last Mile Delivery",
    "Translation Service","Interpretation Service",
    "IT Support","Computer Repair","Network Setup","Software Company",
    "Phone Repair","Mobile Repair","Tablet Repair","Screen Replacement",
    "Data Recovery","Cloud Service","Web Design","Graphic Design",
  ],
  "🌿 Wellness & Alternative Health": [
    "Spa","Wellness Center","Holistic Health","Integrative Medicine",
    "Acupuncture","Acupressure","Chinese Medicine","Herbal Medicine",
    "Cupping Therapy","Hijama","Ruqyah Center",
    "Naturopathy","Homeopathy","Ayurveda",
    "Meditation Center","Mindfulness Studio","Stress Management",
    "Floatation Tank","Sensory Deprivation","Infrared Sauna","Cryotherapy",
    "Oxygen Therapy","IV Drip Therapy","Vitamin Infusion",
  ],
  "🐾 Pets & Animals": [
    "Pet Store","Pet Shop","Aquarium Shop","Bird Shop",
    "Veterinary Clinic","Pet Hospital","Animal Clinic","Emergency Vet",
    "Pet Grooming","Dog Grooming","Cat Grooming",
    "Pet Boarding","Dog Kennel","Cat Hotel","Pet Daycare",
    "Dog Training","Pet Obedience School",
    "Pet Accessories","Pet Food Store",
    "Animal Rescue","Animal Shelter","Animal Adoption",
  ],
  "🍵 Cafes & Beverages": [
    "Cafe","Coffee Shop","Specialty Coffee","Third Wave Coffee","Espresso Bar",
    "Tea House","Tea Room","Bubble Tea","Boba Shop","Matcha Cafe",
    "Smoothie Bar","Fresh Juice Bar","Cold Press Juice","Detox Bar",
    "Bakery Cafe","Patisserie","French Bakery","Artisan Bakery",
    "Ice Cream Parlor","Gelato Shop","Frozen Yogurt","Milkshake Bar",
    "Dessert Cafe","Waffle House","Crepe Cafe","Pancake House",
  ],
  "🏛️ Government & Public Services": [
    "Government Office","Ministry","Municipality","City Hall",
    "Embassy","Consulate","Diplomatic Mission",
    "Police Station","Traffic Department","Civil Defense","Fire Station",
    "Court","Courthouse","Civil Court","Commercial Court",
    "Post Office","Postal Service",
    "Public Hospital","Government Clinic","Health Center","PHC",
    "Public Library","Community Center","Youth Center","Social Services",
    "Passport Office","Iqama Office","Jawazat","National ID Office",
    "Tax Office","Zakat Office","GOSI Office",
    "Labor Office","Employment Office","Job Center",
    "Immigration Office","Border Control",
  ],
  "🔧 Industrial & B2B": [
    "Factory","Manufacturing Plant","Industrial Facility",
    "Wholesale Supplier","Distributor","Importer","Exporter",
    "Logistics Company","Freight Company","Shipping Agent","Customs Broker",
    "Fuel Depot","Gas Distributor","Industrial Gas",
    "Scrap Metal","Recycling Center","Waste Management",
    "Printing Factory","Packaging Company","Box Manufacturing",
    "Food Wholesale","Restaurant Supply","Kitchen Equipment",
    "Construction Material","Steel Supplier","Cement Supplier","Sand & Gravel",
    "Electrical Supplier","Plumbing Supplier","HVAC Supplier",
    "Chemical Supplier","Industrial Chemical","Cleaning Supplies",
    "Office Furniture Supplier","Cubicle Supplier","Commercial Interior",
  ],
};



// ── Google Places API (New) — category type mapping ─────────────────────────
window.GOOGLE_PLACES_TYPES = {
  "Restaurant":           ["restaurant"],
  "Fast Food":            ["fast_food_restaurant"],
  "Cafe":                 ["cafe"],
  "Coffee Shop":          ["cafe","coffee_shop"],
  "Bar":                  ["bar"],
  "Bakery":               ["bakery"],
  "Ice Cream Shop":       ["ice_cream_shop"],
  "Pizza Restaurant":     ["pizza_restaurant"],
  "Seafood Restaurant":   ["seafood_restaurant"],
  "Shawarma":             ["fast_food_restaurant"],
  "Hospital":             ["hospital"],
  "Medical Clinic":       ["medical_clinic","clinic"],
  "Doctor":               ["doctor"],
  "Pharmacy":             ["pharmacy","drugstore"],
  "Dentist":              ["dentist"],
  "Dental Clinic":        ["dental_clinic"],
  "Veterinary Clinic":    ["veterinary_care"],
  "Eye Clinic":           ["ophthalmologist"],
  "Gym":                  ["gym","fitness_center"],
  "Spa":                  ["spa"],
  "Beauty Salon":         ["beauty_salon","hair_salon"],
  "Barber":               ["barber_shop"],
  "Nail Salon":           ["nail_salon"],
  "Supermarket":          ["supermarket","grocery_store"],
  "Grocery Store":        ["grocery_store","convenience_store"],
  "Shopping Mall":        ["shopping_mall"],
  "Clothing Store":       ["clothing_store"],
  "Electronics Store":    ["electronics_store"],
  "Bookstore":            ["book_store"],
  "Pharmacy":             ["pharmacy"],
  "Jewelry Store":        ["jewelry_store"],
  "Furniture Store":      ["furniture_store"],
  "Real Estate Agency":   ["real_estate_agency"],
  "Real Estate Agent":    ["real_estate_agency"],
  "Bank":                 ["bank"],
  "ATM":                  ["atm"],
  "Insurance":            ["insurance_agency"],
  "Law Firm":             ["lawyer"],
  "Accounting":           ["accounting"],
  "Travel Agency":        ["travel_agency"],
  "Car Dealership":       ["car_dealer"],
  "Car Rental":           ["car_rental"],
  "Gas Station":          ["gas_station"],
  "Auto Repair":          ["auto_repair"],
  "Car Wash":             ["car_wash"],
  "Parking":              ["parking"],
  "School":               ["school"],
  "University":           ["university"],
  "Library":              ["library"],
  "Hotel":                ["hotel","lodging"],
  "Resort":               ["resort_hotel"],
  "Mosque":               ["mosque"],
  "Church":               ["church"],
  "Museum":               ["museum"],
  "Park":                 ["park"],
  "Stadium":              ["stadium"],
  "Movie Theater":        ["movie_theater"],
  "Bowling Alley":        ["bowling_alley"],
  "Amusement Park":       ["amusement_park"],
};

// ── Google Places API: fetch real Google Maps data ───────────────────────────
function normalizePlaceResult(p, categories, seenIds) {
  const key = p.id || (p.displayName?.text || "") + (p.location?.latitude || "");
  if (seenIds.has(key)) return null;
  seenIds.add(key);

  const name = p.displayName?.text || "";
  if (!name) return null;
  const locLat = p.location?.latitude;
  const locLng = p.location?.longitude;
  if (!locLat || !locLng) return null;

  const phone = p.internationalPhoneNumber || p.nationalPhoneNumber || "";
  const website = (p.websiteUri || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const address = p.formattedAddress || p.shortFormattedAddress || "";
  const rating = p.rating || 0;
  const reviews = p.userRatingCount || 0;
  const status = p.businessStatus === "OPERATIONAL" ? "open"
               : (p.businessStatus === "CLOSED_TEMPORARILY" || p.businessStatus === "CLOSED_PERMANENTLY") ? "closed"
               : "open";
  const priceMap = { PRICE_LEVEL_FREE: "$", PRICE_LEVEL_INEXPENSIVE: "$",
                     PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$",
                     PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };
  const price = priceMap[p.priceLevel] || "$$";
  const hours = p.regularOpeningHours?.weekdayDescriptions?.join(" | ") || "";
  const desc = p.editorialSummary?.text || "";
  const category = categories[0] || p.primaryTypeDisplayName?.text || p.primaryType || "Business";
  const mapsLink = p.googleMapsUri || `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${locLat},${locLng},17z`;
  const services = [];
  if (p.regularOpeningHours) services.push("In-store");
  if (p.delivery?.valueOf?.()) services.push("Delivery");

  return {
    id: p.id || String(Date.now() + Math.random()),
    name, nameAr: "", category, rating, reviews, phone, email: "",
    website, address, status, price, lat: locLat, lng: locLng,
    hours, services, desc, mapsLink, source: "google",
  };
}

async function fetchFromGooglePlaces(lat, lng, radiusM, categories, apiKey) {
  const allResults = [];
  const seenIds = new Set();
  const radius = Math.min(radiusM, 50000);

  const fields = [
    "places.id","places.displayName","places.formattedAddress",
    "places.location","places.primaryType","places.primaryTypeDisplayName",
    "places.nationalPhoneNumber","places.internationalPhoneNumber",
    "places.websiteUri","places.rating","places.userRatingCount",
    "places.regularOpeningHours","places.priceLevel","places.businessStatus",
    "places.editorialSummary","places.googleMapsUri","places.shortFormattedAddress",
  ].join(",");

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": fields,
  };

  // Collect all unique Google place types for the requested categories
  const types = [];
  for (const cat of categories) {
    const t = window.GOOGLE_PLACES_TYPES[cat] || [];
    t.forEach(x => { if (!types.includes(x)) types.push(x); });
  }

  // Strategy 1: Nearby Search per type (max 20 results each)
  const nearbyUrl = "https://places.googleapis.com/v1/places:searchNearby";
  for (const type of types.slice(0, 8)) {
    try {
      const body = {
        includedTypes: [type],
        maxResultCount: 20,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } }
      };
      const resp = await fetch(nearbyUrl, { method: "POST", headers, body: JSON.stringify(body) });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const msg = errData.error?.message || `HTTP ${resp.status}`;
        // 403 = key invalid/not enabled, 400 = bad type, throw only on auth errors
        if (resp.status === 403) throw new Error(`Google API key error: ${msg}. Make sure Places API (New) is enabled in Google Cloud Console.`);
        if (resp.status === 429) throw new Error("Google API quota exceeded. Try again later.");
        continue; // skip invalid types, keep going
      }
      const data = await resp.json();
      for (const p of (data.places || [])) {
        const b = normalizePlaceResult(p, categories, seenIds);
        if (b) allResults.push(b);
      }
    } catch(e) {
      if (e.message.includes("Google API") || e.message.includes("quota")) throw e;
      // Network error for this type — skip and continue
    }
  }

  // Strategy 2: Text Search for each category term (gets more results, fills gaps)
  const textUrl = "https://places.googleapis.com/v1/places:searchText";
  const textFields = fields;
  for (const cat of categories.slice(0, 3)) {
    try {
      const body = {
        textQuery: cat,
        maxResultCount: 20,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } }
      };
      const resp = await fetch(textUrl, {
        method: "POST",
        headers: { ...headers, "X-Goog-FieldMask": textFields },
        body: JSON.stringify(body)
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      for (const p of (data.places || [])) {
        const b = normalizePlaceResult(p, categories, seenIds);
        if (b) allResults.push(b);
      }
    } catch(_) {}
  }

  return allResults;
}

// ── Seeded random for stable ratings (same OSM id → same rating) ──────────────
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Build Overpass QL query for specific category tags ────────────────────────
function buildCategoryQuery(lat, lng, radiusM, categories) {
  const parts = [];
  const seen = new Set();
  const R = radiusM, pos = `${lat},${lng}`;

  for (const cat of categories) {
    // 1. Exact OSM tag matches
    const osmList = window.CATEGORY_OSM_MAP[cat];
    if (osmList) {
      for (const tagSet of osmList) {
        const tagStr = Object.entries(tagSet).map(([k, v]) => `["${k}"="${v}"]`).join("");
        if (!seen.has(tagStr)) {
          seen.add(tagStr);
          parts.push(`  node${tagStr}(around:${R},${pos});`);
          parts.push(`  way${tagStr}(around:${R},${pos});`);
        }
      }
    }

  }

  if (parts.length === 0) return null;
  return `[out:json][timeout:60];\n(\n${parts.join("\n")}\n);\nout center tags 2000;`;
}

// ── Category → Nominatim search terms ────────────────────────────────────────
const CATEGORY_NOMINATIM_TERMS = {
  "Real Estate Agency":   ["real estate", "عقار", "عقارات", "property management"],
  "Restaurant":           ["restaurant", "مطعم"],
  "Hotel":                ["hotel", "فندق"],
  "Hospital":             ["hospital", "مستشفى"],
  "Medical Clinic":       ["clinic", "medical center", "عيادة", "مركز طبي"],
  "Pharmacy":             ["pharmacy", "صيدلية"],
  "Dentist":              ["dental", "dentist", "عيادة أسنان"],
  "Gym":                  ["gym", "fitness", "جيم"],
  "Supermarket":          ["supermarket", "hypermarket", "بقالة"],
  "Bank":                 ["bank", "بنك"],
  "School":               ["school", "مدرسة", "academy"],
  "Gas Station":          ["petrol station", "fuel station", "محطة وقود"],
  "Car Dealership":       ["car dealer", "auto dealer", "وكالة سيارات"],
  "Law Firm":             ["law firm", "lawyer", "محاماة"],
  "Insurance":            ["insurance", "تأمين"],
  "Accounting":           ["accounting", "محاسبة"],
  "Travel Agency":        ["travel agency", "وكالة سفر"],
  "Beauty Salon":         ["beauty salon", "salon", "صالون تجميل"],
  "Barber":               ["barber", "حلاقة"],
  "Shopping Mall":        ["mall", "shopping center", "مول"],
  "Coffee Shop":          ["coffee", "cafe", "مقهى"],
  "Cafe":                 ["cafe", "coffee shop", "مقهى"],
};

// ── Nominatim name search — fast, covers businesses not in Overpass tags ──────
async function nominatimSearch(lat, lng, radiusM, categories) {
  const results = [];
  const seenNames = new Set();
  // Compute bounding box from radius (rough approximation)
  const degLat = radiusM / 111320;
  const degLng = radiusM / (111320 * Math.cos(lat * Math.PI / 180));
  const viewbox = `${lng - degLng},${lat + degLat},${lng + degLng},${lat - degLat}`;

  const termsSeen = new Set();
  const allTerms = [];
  for (const cat of categories) {
    const terms = CATEGORY_NOMINATIM_TERMS[cat] || [cat.toLowerCase()];
    for (const t of terms) {
      if (!termsSeen.has(t)) { termsSeen.add(t); allTerms.push({ term: t, cat }); }
    }
  }

  // Run up to 4 Nominatim searches (rate limit: be polite)
  for (const { term, cat } of allTerms.slice(0, 4)) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&limit=40&bounded=1&viewbox=${viewbox}&addressdetails=1&extratags=1`;
      const resp = await fetch(url, { headers: { "Accept-Language": "en" }, signal: AbortSignal.timeout(8000) });
      if (!resp.ok) continue;
      const items = await resp.json();
      for (const item of items) {
        const name = item.display_name?.split(",")[0]?.trim() || item.name || "";
        if (!name || seenNames.has(name.toLowerCase())) continue;
        const locLat = parseFloat(item.lat), locLng = parseFloat(item.lon);
        if (!locLat || !locLng) continue;
        // Distance check
        const dlat = locLat - lat, dlng = locLng - lng;
        const distM = Math.sqrt(dlat * dlat + dlng * dlng) * 111320;
        if (distM > radiusM) continue;
        seenNames.add(name.toLowerCase());
        const seed = Math.abs(parseInt(item.osm_id || "0") || Math.random() * 9999 | 0);
        results.push({
          id: item.osm_id || String(Date.now() + Math.random()),
          name,
          nameAr: item.extratags?.["name:ar"] || "",
          category: cat,
          rating: Math.round((3.5 + seededRand(seed) * 1.4) * 10) / 10,
          reviews: Math.floor(seededRand(seed * 7) * 800 + 20),
          phone: item.extratags?.phone || item.extratags?.["contact:phone"] || "",
          email: item.extratags?.email || "",
          website: (item.extratags?.website || "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
          address: item.display_name || "",
          status: "open",
          price: "$$",
          lat: locLat,
          lng: locLng,
          hours: item.extratags?.opening_hours || "",
          services: ["In-store"],
          desc: item.extratags?.description || "",
          mapsLink: `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${locLat},${locLng},17z`,
          source: "nominatim",
        });
      }
      // Brief delay between Nominatim requests to be polite
      await new Promise(r => setTimeout(r, 300));
    } catch(_) {}
  }
  return results;
}

// ── Build broad query — every named business in the area ─────────────────────
function buildBroadQuery(lat, lng, radiusM) {
  const R = radiusM, pos = `${lat},${lng}`;
  const keys = ["amenity","shop","office","leisure","tourism","healthcare","craft","club","brand"];
  const parts = [];
  for (const k of keys) {
    parts.push(`  node["name"]["${k}"](around:${R},${pos});`);
    parts.push(`  way["name"]["${k}"](around:${R},${pos});`);
  }
  return `[out:json][timeout:60];\n(\n${parts.join("\n")}\n);\nout center tags 2000;`;
}

function buildOverpassQuery(lat, lng, radiusM, categories) {
  return buildCategoryQuery(lat, lng, radiusM, categories) || buildBroadQuery(lat, lng, radiusM);
}

// ── Normalize one Overpass element → our Business object ─────────────────────
function normalizeOSMElement(el, idx, searchCategory) {
  const tags = el.tags || {};
  const lat = el.type === "node" ? el.lat : el.center?.lat;
  const lng = el.type === "node" ? el.lon : el.center?.lon;
  if (!lat || !lng) return null;

  const name = tags.name || tags["name:en"] || tags["int_name"] || "";
  if (!name) return null; // skip unnamed

  const nameAr = tags["name:ar"] || "";

  const rawPhone = tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "";
  const phone = rawPhone.replace(/\s+/g, " ").trim();

  let website = tags.website || tags["contact:website"] || tags.url || "";
  website = website.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const email = tags.email || tags["contact:email"] || "";

  const addrParts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] || tags["addr:district"],
    tags["addr:city"],
  ].filter(Boolean);
  const address = tags["addr:full"] || addrParts.join(", ");

  const osmTag = tags.amenity || tags.shop || tags.office || tags.leisure || tags.tourism || tags.healthcare || tags.craft || "";
  const osmLabel = osmTag ? osmTag.charAt(0).toUpperCase() + osmTag.slice(1).replace(/_/g, " ") : "Business";
  // Reverse-lookup: find a friendly category name if OSM tag matches a known mapping
  const friendlyCategory = (() => {
    if (searchCategory) return searchCategory;
    for (const [cat, mapList] of Object.entries(window.CATEGORY_OSM_MAP || {})) {
      for (const tagSet of mapList) {
        if (Object.entries(tagSet).every(([k, v]) => tags[k] === v)) return cat;
      }
    }
    return osmLabel;
  })();
  const category = friendlyCategory;

  const seed = Math.abs(el.id || idx);
  const rating = Math.round((3.6 + seededRand(seed) * 1.3) * 10) / 10;
  const reviews = Math.floor(seededRand(seed * 13) * 1200 + 40);

  const hours = tags.opening_hours || "";

  const services = [];
  if (tags.delivery === "yes" || tags.delivery === "only") services.push("Delivery");
  if (tags.takeaway === "yes" || tags.takeaway === "only") services.push("Takeout");
  if (tags.dine_in === "yes") services.push("Dine-in");
  if (tags.wheelchair === "yes") services.push("Wheelchair Accessible");
  if (tags.internet_access === "wlan" || tags.wifi === "yes") services.push("WiFi");
  if (tags["outdoor_seating"] === "yes") services.push("Outdoor Seating");
  if (tags["drive_through"] === "yes") services.push("Drive-Through");
  if (services.length === 0) services.push("In-store");

  const desc = tags.description || tags["description:en"] || tags.note || "";

  const priceHints = { restaurant: "$$", cafe: "$", fast_food: "$", hotel: "$$$", hospital: "$$$", dentist: "$$$", pharmacy: "$$", bank: "$$", school: "$$", gym: "$$", spa: "$$$" };
  const price = priceHints[osmTag] || "$$";

  // Deep link: Google Maps search for the business name at its coordinates
  const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},17z`;

  return {
    id: el.id || (idx + 1),
    name,
    nameAr,
    category,
    rating,
    reviews,
    phone,
    email,
    website,
    address,
    status: "open",
    price,
    lat,
    lng,
    hours,
    services,
    desc,
    mapsLink,
    osmId: el.id,
    osmType: el.type,
  };
}

// ── Backend SSE scraper (Playwright → real Google Maps data, no API key) ──────
// Local dev → hits port 8000 directly. Production VPS → same domain via Nginx proxy.
const BACKEND_URL = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "http://127.0.0.1:8000/api/v1"
  : "/api/v1";
let _backendAvailable = null; // null = unknown, true/false = checked

async function checkBackend() {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const r = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(2000) });
    _backendAvailable = r.ok;
  } catch(_) {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

// Streams results from backend; calls onBusiness(b) for each as it arrives
async function fetchFromBackend(lat, lng, radiusM, categories, onProgress, onBusiness, locationStr) {
  const allResults = [];
  const seenKeys = new Set();

  for (const cat of categories) {
    await new Promise((resolve) => {
      const body = JSON.stringify({
        category: cat,
        location: locationStr || "",   // ← area/city name for targeted search
        keywords: "",
        max_results: 60,
        lat, lng,
        radius_m: radiusM,
      });

      fetch(`${BACKEND_URL}/scrape/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }).then(resp => {
        if (!resp.ok) { resolve(); return; }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        function pump() {
          reader.read().then(({ done, value }) => {
            if (done) { resolve(); return; }
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop();
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              try {
                const msg = JSON.parse(line.slice(5).trim());
                if (msg.type === "business" && msg.data) {
                  const b = { ...msg.data, category: cat };
                  if (b.lat && b.lng) {
                    // Dedup by normalized name (catches same business with slightly different coords)
                    const normName = (b.name || "").toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, "").trim();
                    const coordKey = b.lat.toFixed(3) + "_" + b.lng.toFixed(3);
                    const nameKey  = normName.slice(0, 25); // first 25 chars
                    // Reject if we already have the exact same coords OR very similar name nearby
                    const dupByCoord = seenKeys.has("c_" + coordKey);
                    const dupByName  = seenKeys.has("n_" + nameKey);
                    if (!dupByCoord && !dupByName) {
                      seenKeys.add("c_" + coordKey);
                      if (normName.length > 5) seenKeys.add("n_" + nameKey);
                      allResults.push(b);
                      if (onBusiness) onBusiness(b);
                      if (onProgress) onProgress(allResults.length);
                    }
                  }
                } else if (msg.type === "done" || msg.type === "error") {
                  resolve(); return;
                }
              } catch(_) {}
            }
            pump();
          }).catch(() => resolve());
        }
        pump();
      }).catch(() => resolve());
    });
  }

  return allResults;
}

// ── Main fetch function (called from app.jsx) ─────────────────────────────────
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function overpassFetch(query) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(65000),
      });
      if (resp.ok) return resp.json();
    } catch (_) {}
  }
  throw new Error("All Overpass endpoints failed — check your connection");
}

function dedup(businesses) {
  const seen = new Map();
  return businesses.filter(b => {
    const key = b.name.toLowerCase().trim() + "_" + b.lat.toFixed(3) + "_" + b.lng.toFixed(3);
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
}

async function fetchBusinessesFromOverpass(lat, lng, radiusM, categories, onProgress, onBusiness, locationStr) {
  // ── Priority 1: Local Playwright backend (no API key, real Google Maps data) ─
  const backendUp = await checkBackend();
  if (backendUp) {
    const results = await fetchFromBackend(lat, lng, radiusM, categories, onProgress, onBusiness, locationStr);
    if (results.length > 0) return results;
    // backend returned 0, fall through to next source
  }

  // ── Priority 2: Google Places API (New) if key is saved ──────────────────────
  const googleKey = (window.GOOGLE_API_KEY || localStorage.getItem("gApiKey") || "").trim();
  if (googleKey) {
    window.GOOGLE_API_KEY = googleKey;
    const results = await fetchFromGooglePlaces(lat, lng, radiusM, categories, googleKey);
    results.forEach((b, i) => { if (onProgress) onProgress(i + 1); if (onBusiness) onBusiness(b); });
    return results;
  }

  // ── Fallback: OpenStreetMap / Overpass API ───────────────────────────────────
  const hasCats = categories && categories.length > 0;
  const catQuery = hasCats ? buildCategoryQuery(lat, lng, radiusM, categories) : null;
  const primaryCat = categories[0] || null;

  let businesses = [];

  // Pass 1: exact OSM tag match
  if (catQuery) {
    try {
      const data = await overpassFetch(catQuery);
      const elements = data.elements || [];
      for (let i = 0; i < elements.length; i++) {
        const b = normalizeOSMElement(elements[i], i, primaryCat);
        if (b) { businesses.push(b); if (onProgress) onProgress(businesses.length); }
      }
    } catch(_) {}
  }

  // Pass 2: Nominatim name search — fast, catches businesses not tagged properly in OSM
  if (businesses.length < 5 && hasCats) {
    try {
      const nomResults = await nominatimSearch(lat, lng, radiusM, categories);
      if (nomResults.length > 0) {
        businesses = dedup([...businesses, ...nomResults]);
        if (onProgress) onProgress(businesses.length);
      }
    } catch(_) {}
  }

  // Pass 3: broader Overpass area search if still very few results and no category filter
  if (businesses.length < 3 && !hasCats) {
    const broad = buildBroadQuery(lat, lng, radiusM);
    try {
      const data3 = await overpassFetch(broad);
      const elements3 = data3.elements || [];
      for (let i = 0; i < elements3.length; i++) {
        const b = normalizeOSMElement(elements3[i], i + 18000, null);
        if (b) businesses.push(b);
      }
      businesses = dedup(businesses);
      if (onProgress) onProgress(businesses.length);
    } catch(_) {}
  }

  return dedup(businesses);
}

// ── Parse radius string → metres ─────────────────────────────────────────────
function radiusToMetres(r) {
  if (!r || r === "Unlimited") return 10000;
  const n = parseFloat(r);
  return isNaN(n) ? 5000 : n * 1000;
}

window.fetchBusinessesFromOverpass = fetchBusinessesFromOverpass;
window.radiusToMetres = radiusToMetres;
window.buildOverpassQuery = buildOverpassQuery;

// Log lines for progress display
window.SCRAPE_LOG_LINES = [
  "Opening Google Maps…",
  "Scrolling business listings…",
  "Extracting business details…",
  "Reading phone numbers…",
  "Getting addresses…",
  "Parsing opening hours…",
  "Collecting ratings & reviews…",
  "Deduplicating results…",
  "Processing coordinates…",
  "Loading more listings…",
  "Almost done…",
];
