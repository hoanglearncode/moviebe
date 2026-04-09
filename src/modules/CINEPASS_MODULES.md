# CinePass Backend Module Inventory

Nguon doi chieu:

- `fe/CinePass_BA_Document.docx`
- `fe/plan.md`
- `fe/case.md`
- `CinePass_Assessment_Report.md`

Trang thai:

- Tai lieu nay chi dung de liet ke module va xac dinh skeleton thu muc.
- Chua implement business logic.
- Cac module moi da duoc tao san thu muc duoi `be/src/modules/<module>/`.

## 1. Module hien co

- `auth`
- `user`
- `partner`
- `category`
- `system`

## 2. Module moi da scaffold

### Identity va quan tri

- `admin`
- `audit`

### Catalog va screening

- `cinema`
- `room`
- `movie`
- `showtime`
- `seat`

### Commerce va ticketing

- `booking`
- `ticket`
- `transaction`
- `payment`
- `pass`
- `wallet`
- `withdrawal`
- `promotion`

### Engagement

- `review`
- `watchlist`
- `notification`

### Reporting

- `report`

## 3. Mapping BA -> module

### 3.1 Authentication & Authorization

- `auth`
- `user`
- `admin`
- `audit`

### 3.2 Quan ly phim va suat chieu

- `movie`
- `showtime`
- `seat`
- `cinema`
- `room`
- `category`

### 3.3 Mua ban va giao dich ve

- `booking`
- `ticket`
- `transaction`

### 3.4 Pass ve

- `pass`
- `ticket`
- `audit`

### 3.5 Thanh toan truc tuyen

- `payment`
- `wallet`
- `transaction`
- `withdrawal`
- `promotion`

### 3.6 Danh gia va tuong tac

- `review`
- `watchlist`
- `notification`

### 3.7 Thong ke va bao cao

- `report`
- `audit`

### 3.8 Quan tri nen tang

- `admin`
- `partner`
- `report`
- `audit`
- `system`

## 4. Core data model -> module

- `User`, `Session`, `UserSetting` -> `user`
- `Partner` -> `partner`
- `Movie` -> `movie`
- `Cinema` -> `cinema`
- `Room` -> `room`
- `Seat` -> `seat`
- `Showtime` -> `showtime`
- `Ticket` -> `ticket`
- `Transaction` -> `transaction`
- `PassHistory` -> `pass`
- `Review` -> `review`
- `WithdrawalRequest` -> `withdrawal`

## 5. Quy uoc skeleton thu muc

Moi module moi duoc tao theo skeleton:

```text
<module>/
  infras/
    repository/
    rpc/
    transport/
  interface/
  model/
  shared/
  usecase/
```

## 6. Ghi chu tach module

- `check-in` duoc dat trong `ticket` va/hoac `showtime`, khong tach module rieng.
- `refund` duoc xem la workflow cua `transaction`, `payment`, `withdrawal`.
- `seat-lock` la co che trong `seat` + `system`, khong tao module rieng.
- `partner finance` se trai tren `wallet`, `withdrawal`, `report`, `transaction`.

