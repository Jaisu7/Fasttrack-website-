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
};
export const products: Product[] = [
  {
    id: "worktable",
    name: "Worktables & preparation",
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
  },
  {
    id: "shelves",
    name: "Storage & shelving",
    category: "Storage",
    image: "/images/storage.jpg",
    description: "Make better use of every square metre.",
    detail:
      "Shelving and storage solutions for back-of-house operations and retail environments. Discuss your available space, storage items, access and finish requirements with the team.",
    options: [
      "Storage and display shelving",
      "Layouts for kitchens and retail",
      "Configuration to suit your space",
    ],
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
