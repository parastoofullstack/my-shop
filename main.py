from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="Shop 3D API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- داده‌های فروشگاه ----------
PRODUCTS = [
    {
        "id": 1,
        "name": "ساعت هوشمند نئون",
        "price": 4500000,
        "color": "#7c3aed",
        "shape": "knot",
        "description": "ساعت هوشمند با طراحی مینیمال و صفحه نمایش AMOLED.",
    },
    {
        "id": 2,
        "name": "هدفون بی‌سیم کوانتوم",
        "price": 3200000,
        "color": "#06b6d4",
        "shape": "icosa",
        "description": "صدای استریو با حذف نویز فعال و باتری ۴۰ ساعته.",
    },
    {
        "id": 3,
        "name": "کیف لپ‌تاپ کیوب",
        "price": 1800000,
        "color": "#f59e0b",
        "shape": "box",
        "description": "کیف ضدضربه با جنس چرم طبیعی و فضای کافی برای لپ‌تاپ ۱۶ اینچ.",
    },
    {
        "id": 4,
        "name": "لامپ کره‌ای سولار",
        "price": 950000,
        "color": "#10b981",
        "shape": "sphere",
        "description": "لامپ دکوراتیو با نور قابل تنظیم و اتصال به اپلیکیشن.",
    },
    {
        "id": 5,
        "name": "اسپیکر اکتا",
        "price": 2700000,
        "color": "#ef4444",
        "shape": "octa",
        "description": "اسپیکر قابل حمل با بیس قوی و مقاومت در برابر آب.",
    },
    {
        "id": 6,
        "name": "استند مخروطی دسک",
        "price": 650000,
        "color": "#ec4899",
        "shape": "cone",
        "description": "استند مدرن برای نگهداری گجت‌ها روی میز کار.",
    },
]

ORDERS = []


# ---------- مدل‌ها ----------
class OrderItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, le=100)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2)
    phone: str = Field(min_length=6)
    address: str = Field(min_length=5)
    items: List[OrderItem]


# ---------- API ----------
@app.get("/api/products")
def list_products():
    return PRODUCTS


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="محصول پیدا نشد")
    return product


@app.post("/api/orders", status_code=201)
def create_order(order: OrderCreate):
    if not order.items:
        raise HTTPException(status_code=400, detail="سبد خرید خالیه")

    total = 0
    for item in order.items:
        product = next((p for p in PRODUCTS if p["id"] == item.product_id), None)
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"محصول با شناسه {item.product_id} پیدا نشد",
            )
        total += product["price"] * item.quantity

    record = {
        "id": len(ORDERS) + 1,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "address": order.address,
        "items": [i.model_dump() for i in order.items],
        "total": total,
    }
    ORDERS.append(record)

    return {
        "message": "سفارش با موفقیت ثبت شد",
        "order_id": record["id"],
        "total": total,
    }


@app.get("/api/orders")
def list_orders():
    return ORDERS

from fastapi.responses import FileResponse

@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index3.html")
    
# ---------- سرو کردن فرانت‌اند ----------
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")