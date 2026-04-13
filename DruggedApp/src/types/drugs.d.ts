declare module '../assets/drugs_web_fallback.json' {
  const value: {
    id: number;
    trade_name: string;
    active_ingredient: string;
    price: number;
    price_old: number | null;
    manufacturer: string | null;
    distributor: string | null;
    category: string | null;
    subcategory: string | null;
    subcategory2: string | null;
    route: string | null;
    search_index: string | null;
  }[];
  export default value;
}