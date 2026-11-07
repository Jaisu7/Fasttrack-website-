export const categories = [
  "All products",
  "Kitchen equipment",
  "Display & refrigeration",
  "Storage",
  "Custom fabrication",
] as const;
export type Category = (typeof categories)[number];
export type Product = {
  id: string;
  name: string;
  category: Category;
  image: string;
  description: string;
  detail: string;
  options: string[];
  illustrative?: boolean;
  operation?: "doors" | "lights" | "water";
  video?: string;
};
export const products: Product[] = [
  {
    id: "wine-chiller",
    name: "Wine Chiller",
    category: "Display & refrigeration",
    image: "/images/wine-chiller.jpg",
    video: "/videos/wine-chiller.mp4",
    description: "A collection, beautifully presented.",
    detail: "See an illuminated wine chiller installation in motion. Glass-fronted presentation and organised bottle storage create a focal point for hospitality interiors. Share your layout and storage requirements to discuss a project-specific solution.",
    options: ["Wine display layouts", "Bottle storage arrangement", "Cooling requirements reviewed per project"],
  },
  {
    id: "worktable",
    name: "SS preparation tables",
    category: "Kitchen equipment",
    image: "/images/worktable.webp",
    description: "Purpose-built surfaces for busy kitchens.",
    detail:
      "Stainless steel worktables and preparation stations shaped around your layout and daily workflow. Share your preferred dimensions, shelf arrangement and installation requirements with our team.",
    options: [
      "Worktops and preparation stations",
      "Lower shelves and upstands",
      "Dimensions to suit your layout",
    ],
    illustrative: true,
  },
  {
    id: "refrigerator",
    name: "Upright refrigerators",
    category: "Display & refrigeration",
    image: "/images/project-11.png",
    description: "Cold storage around your kitchen workflow.",
    detail: "Explore a representative upright refrigerator with opening doors and internal shelves. Capacity, cooling performance, dimensions and equipment specification must be confirmed for your project.",
    options: ["Upright cold storage", "Internal shelving", "Cooling requirements reviewed per project"],
    illustrative: true,
    operation: "doors",
  },
  {
    id: "hot-cabinet",
    name: "Hot holding cabinets",
    category: "Kitchen equipment",
    image: "/images/project-11.png",
    description: "A considered place for prepared food.",
    detail: "A hot holding cabinet concept with a glazed door and tray positions. Share your foodservice workflow so temperature requirements, controls and final equipment specification can be reviewed.",
    options: ["Food holding cabinet layouts", "Tray arrangements", "Operating requirements reviewed per project"],
    illustrative: true,
    operation: "doors",
  },
  {
    id: "display",
    name: "Refrigerated displays",
    category: "Display & refrigeration",
    image: "/images/display.webp",
    description: "Present your products. Preserve their quality.",
    detail:
      "Display solutions for food retail, hospitality and service counters. Tell us what you plan to display, your available space and your cooling requirements so the team can review the right configuration.",
    options: [
      "Food retail and deli displays",
      "Counter layouts and finishes",
      "Equipment requirements reviewed per project",
    ],
    illustrative: true,
    operation: "lights",
  },
  {
    id: "sink",
    name: "Sinks & wash stations",
    category: "Kitchen equipment",
    image: "/images/sink.webp",
    description: "Practical hygiene, designed into every detail.",
    detail:
      "Stainless steel sinks and wash stations for commercial environments. Bowl arrangements, work surfaces and the installation layout are discussed around your project’s practical needs.",
    options: [
      "Single and multiple bowl layouts",
      "Drainboards and splashbacks",
      "Layout coordinated with site services",
    ],
    illustrative: true,
    operation: "water",
  },
  {
    id: "sink-shelf",
    name: "Sinks with lower shelves",
    category: "Kitchen equipment",
    image: "/images/sink.webp",
    description: "Washing and open storage in one station.",
    detail: "A sink station concept with a distinct lower storage shelf. Bowl layout, drainage, shelf clearance and installation requirements are coordinated around your space.",
    options: ["Sink and lower shelf arrangement", "Open under-sink storage", "Site services coordination"],
    illustrative: true,
    operation: "water",
  },
  {
    id: "rack",
    name: "Freestanding storage racks",
    category: "Storage",
    image: "/images/storage.jpg",
    description: "Make better use of every square metre.",
    detail:
      "Freestanding multi-tier rack concepts for back-of-house storage. Discuss available space, stored items and access with the team; loading and final construction require project review.",
    options: [
      "Storage and display shelving",
      "Layouts for kitchens and retail",
      "Configuration to suit your space",
    ],
    illustrative: true,
  },
  {
    id: "shelves",
    name: "Wall-mounted shelves",
    category: "Storage",
    image: "/images/storage.jpg",
    description: "Useful storage above your working surface.",
    detail: "Wall-mounted stainless-steel shelf concepts with support brackets. Wall construction, fixings, usable clearance and loading must be assessed before installation.",
    options: ["Wall shelf layouts", "Support brackets", "Fixings and loading reviewed for installation"],
    illustrative: true,
  },
  {
    id: "produce-shelf",
    name: "Fruit & vegetable shelves",
    category: "Storage",
    image: "/images/storage.jpg",
    description: "Open, organised produce presentation.",
    detail: "A stepped fruit and vegetable display concept with separate produce bins. Shelf arrangement, cleaning access and the final retail layout are developed for your project.",
    options: ["Tiered produce bins", "Open retail presentation", "Project-specific shelf layouts"],
    illustrative: true,
  },
  {
    id: "cabinets",
    name: "Cabinets & counters",
    category: "Storage",
    image: "/images/project-11.png",
    description: "A place for everything. A finish that lasts.",
    detail:
      "Stainless steel cabinets and fitted counters bring work surfaces and enclosed storage into one considered layout. Use your drawings or site measurements as the starting point for a quotation.",
    options: [
      "Fitted cabinets and work counters",
      "Enclosed undercounter storage",
      "Project-specific dimensions",
    ],
    illustrative: true,
    operation: "doors",
  },
  {
    id: "custom",
    name: "Custom retail fabrication",
    category: "Custom fabrication",
    image: "/images/project-13.png",
    description: "Built around your vision and your space.",
    detail:
      "Custom fabricated counters, displays and sheet metal components for retail and commercial projects. Share a sketch, technical drawing or reference image to start the conversation.",
    options: [
      "Retail counters and displays",
      "Sheet metal fabrication",
      "Drawing and specification review",
    ],
    illustrative: true,
  },
];
export const processes = [
  {
    title: "CNC laser cutting",
    short: "Complex profiles. Clean, consistent cuts.",
    description:
      "Detailed profiles and sheet metal components cut from your technical drawings.",
    image: "/images/hero.webp",
    illustrative: true,
  },
  {
    title: "CNC punching",
    short: "Repeatable patterns. Purposeful details.",
    description:
      "Holes, openings and repeated patterns prepared for your component requirements.",
    image: "/images/punching.jpg",
  },
  {
    title: "Precision bending",
    short: "Flat sheet. Thoughtful form.",
    description:
      "Controlled bends turn sheet metal into the forms your project needs.",
    image: "/images/bending.jpg",
  },
  {
    title: "Welding & finishing",
    short: "Strong connections. Considered finishes.",
    description:
      "Welded components and finished details bring the fabrication together.",
    image: "/images/welding.jpg",
  },
];
