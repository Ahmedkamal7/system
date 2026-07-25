import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PrintInvoice({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data: sale } = await supabase
    .from("sales")
    .select(`*, customers ( name ), warehouses ( name )`)
    .eq("id", params.id)
    .single();

  if (!sale) notFound();

  const { data: items } = await supabase
    .from("sale_items")
    .select(`*, products ( name )`)
    .eq("sale_id", params.id);

  const qrData = encodeURIComponent(`Invoice:${sale.invoice_number || sale.id}|Total:${sale.total_amount}|Date:${sale.created_at}`);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;

  return (
    <div className="bg-white p-8 max-w-3xl mx-auto" dir="rtl">
      <style>{`@media print { body { visibility: hidden; } #print-area { visibility: visible; position: absolute; top: 0; right: 0; width: 100%; } }`}</style>
      
      <div id="print-area" className="p-8 border border-border rounded-xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">فاتورة مبيعات</h1>
            <p className="text-text-secondary text-sm mt-1">رقم الفاتورة: {sale.invoice_number || sale.id.substring(0,8)}</p>
            <p className="text-text-secondary text-sm">التاريخ: {new Date(sale.created_at).toLocaleDateString('ar-EG')}</p>
          </div>
          <img src={qrImageUrl} alt="QR Code" className="w-24 h-24" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-background rounded-xl">
          <div>
            <p className="text-xs text-text-secondary">العميل</p>
            <p className="font-semibold text-text-primary">{sale.customers?.name || "عميل نقدي"}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">المخزن</p>
            <p className="font-semibold text-text-primary">{sale.warehouses?.name || "—"}</p>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead className="border-b-2 border-border">
            <tr>
              <th className="text-right py-2 text-sm text-text-secondary">الصنف</th>
              <th className="text-center py-2 text-sm text-text-secondary">الكمية</th>
              <th className="text-center py-2 text-sm text-text-secondary">السعر</th>
              <th className="text-left py-2 text-sm text-text-secondary">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-3 text-sm text-text-primary">{item.products?.name}</td>
                <td className="py-3 text-center text-sm text-text-primary">{item.quantity}</td>
                <td className="py-3 text-center text-sm text-text-primary">{item.unit_price.toLocaleString()}</td>
                <td className="py-3 text-left text-sm font-semibold text-text-primary">{item.total_price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/2 space-y-2">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>المجموع الفرعي:</span>
              <span>{sale.sub_total.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>الخصم:</span>
              <span>- {sale.discount_amount.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>الضريبة:</span>
              <span>+ {sale.tax_amount.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-text-primary border-t-2 border-border pt-2 mt-2">
              <span>الإجمالي:</span>
              <span>{sale.total_amount.toLocaleString()} ر.س</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 no-print">
        <button onClick={() => window.print()} className="bg-primary-blue text-white px-8 py-2 rounded-xl hover:bg-blue-600 transition-colors">
          طباعة
        </button>
      </div>
    </div>
  );
}
