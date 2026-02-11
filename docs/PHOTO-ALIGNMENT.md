# Photo Alignment Strategy

## 🎯 Problem: Face Cut-Off

When photos are displayed in different aspect ratios (tiles vs modal), faces can get awkwardly cropped if we use default alignment (top-left).

---

## ✅ Solution: Center Alignment

**CSS Property:** `object-position: center`  
**Tailwind Class:** `object-center`

This ensures that when a photo is cropped to fit a container, **the center of the image is preserved** - which is where faces typically are.

---

## 📐 How It Works:

### **Tile Layout (3:2 ratio - 192px tall)**
```
Original Photo (Portrait):        Cropped Result:
┌──────────────┐                  
│              │                  ┌──────────────┐
│     👤        │     →           │     👤        │
│   (Face)     │                  │   (Face)     │
│              │                  └──────────────┘
│              │                  
│              │                  Top/bottom cropped,
└──────────────┘                  face preserved ✅
```

### **Tile Layout (Landscape Photo)**
```
Original Photo:                   Cropped Result:
┌────────────────────────┐        
│         👤             │   →    ┌──────────────┐
│       (Face)           │        │     👤        │
└────────────────────────┘        │   (Face)     │
                                  └──────────────┘
Left/right cropped,               
face preserved ✅
```

### **Modal (4:3 ratio - 320px tall)**
```
Same center alignment principle applies
Just different aspect ratio
```

---

## 💻 Implementation:

### **HTML/Preview Files:**
```html
<img 
  src="photo.jpg" 
  class="w-full h-full object-cover object-center"
/>
```

### **React Components:**
```tsx
<img 
  src={message.guest_photo_url}
  alt="Guest"
  className="w-full h-full object-cover object-center"
/>
```

---

## 🎨 Alternative Positions (Not Used):

**Top:** `object-top` - Good for headshots, bad for full-body  
**Bottom:** `object-bottom` - Crops heads off, not ideal  
**Left/Right:** `object-left` / `object-right` - Not useful for portraits  

**Center is the safest default for profile photos!**

---

## 📱 Updated Files:

✅ `/previews/customer-dashboard-tiles.html` (all 4 tiles)  
✅ `/previews/message-detail-modal.html`  
✅ `/previews/message-detail-edit.html`  
✅ `/src/components/MessageDetailModal.tsx`  

---

## 🎯 Result:

**Before:** Faces could be cut off at edges  
**After:** Faces always centered and visible ✅

---

## 💡 User Benefit:

When customers upload photos of their guests:
- **Portrait photos:** Top/bottom cropped, face visible
- **Landscape photos:** Sides cropped, face visible  
- **Square photos:** No cropping needed
- **Group photos:** Center of group visible

**No awkward half-faces or cut-off heads!**
