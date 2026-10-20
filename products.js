/* بيانات المنتجات — مؤقتة. لما نوصل للداتابيز هتتبدل بجداول categories و products.
   الأسعار أرقام تجريبية: عدّليها بأسعارك الحقيقية. */
const CATEGORIES = [
  { id: "business-card", name: "Business Card", icon: "fa-regular fa-id-card" },
  { id: "magazine", name: "Magazine", icon: "fa-regular fa-newspaper" },
  { id: "notebook", name: "Notebook & Coloring Book", icon: "fa-solid fa-book-open" },
  { id: "tableau", name: "Tableau", icon: "fa-solid fa-image" },
  { id: "giveaways", name: "Giveaways", icon: "fa-solid fa-gift" }
];

let PRODUCTS = [
  { id: 1, cat: "business-card", name: "Luxury Business Card", desc: "Premium business cards with a luxury finish.", price: 150, unit: "per pack", personalize: true,
    options: [{ key: "Paper", choices: [{ name: "Matte", add: 0 }, { name: "Glossy", add: 10 }, { name: "Textured", add: 25 }] }, { key: "Pack", choices: [{ name: "100 cards", add: 0 }, { name: "200 cards", add: 120 }] }],
    images: ["img/WhatsApp Image 2026-07-28 at 8.18.04 AM.jpeg", "img/WhatsApp Image 2026-07-28 at 8.18.03 AM.jpeg", "img/Screenshot 2026-07-28 083056.png"] },
  { id: 2, cat: "magazine", name: "Creative Magazine", desc: "A custom magazine layout, ready to print.", price: 400, unit: "per design",
    options: [{ key: "Pages", choices: [{ name: "8 pages", add: 0 }, { name: "16 pages", add: 200 }, { name: "24 pages", add: 400 }] }, { key: "Paper", choices: [{ name: "Matte", add: 0 }, { name: "Glossy", add: 50 }] }],
    images: ["img/178484846400067957.jpg", "img/178484850200084248 (1).jpg", "img/178484880300081069.jpg"] },
  { id: 3, cat: "notebook", name: "Notebook & Coloring Book", desc: "Notebooks and coloring books with your own artwork.", price: 120, unit: "per copy",
    options: [{ key: "Type", choices: [{ name: "Notebook", add: 0 }, { name: "Coloring book", add: 0 }] }, { key: "Cover", choices: [{ name: "Soft cover", add: 0 }, { name: "Hard cover", add: 40 }] }],
    images: ["img/color4.jpg", "img/color3.jpg", "img/color2.jpg"] }
];

// التوصيل داخل بورسعيد بس (رسوم تجريبية: عدّليها)
const SHIPPING = { "Port Said": 30, "Port Fouad": 40 };
const WHATSAPP_OR_INSTAGRAM = "https://www.instagram.com/minnie_design_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";
const money = n => n.toLocaleString("en-US") + " EGP";

// طرق الدفع — الأرقام تجريبية، حطي أرقامك الحقيقية. proof:true = العميل يرفع صورة التحويل
const PAYMENT = [
  { id: "Cash on delivery", label: "Cash on delivery", info: "Pay the courier when your order arrives." },
  { id: "InstaPay", label: "InstaPay", proof: true, info: "Send the total to our InstaPay address: yourname@instapay" },
  { id: "Vodafone Cash", label: "Vodafone Cash", proof: true, info: "Send the total to Vodafone Cash number: 01XXXXXXXXX" }
];