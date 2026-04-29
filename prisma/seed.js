"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
// ── Helpers ────────────────────────────────────────────────────────────────────
const uid = () => crypto.randomUUID();
const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (d) => new Date(Date.now() - d * 86400000);
const daysLater = (d) => new Date(Date.now() + d * 86400000);
const addHours = (base, h) => new Date(base.getTime() + h * 3600000);
const DOMAIN = 'seedcinema.local';
// ── Static templates ───────────────────────────────────────────────────────────
const CINEMA_DATA = [
    { name: 'CGV Vincom Bà Triệu', address: '191 Bà Triệu, Hai Bà Trưng', city: 'Hà Nội', phone: '1900601701', email: `cgv.hanoi@${DOMAIN}`, taxCode: 'SEED0301234561', bankAccountName: 'CÔNG TY TNHH CGV VIỆT NAM', bankAccountNumber: '0021000111111', bankName: 'Vietcombank', bankCode: 'VCB', commissionRate: 0.1, lat: 21.0073, lng: 105.8506, desc: 'Chuỗi rạp chiếu phim hàng đầu tại Hà Nội với hệ thống âm thanh và hình ảnh hiện đại.', facilities: ['parking', 'food_court', 'atm', 'wheelchair_access'] },
    { name: 'Lotte Cinema Cantavil', address: '21 Song Hành, An Phú, Quận 2', city: 'TP. Hồ Chí Minh', phone: '1900608601', email: `lotte.hcm@${DOMAIN}`, taxCode: 'SEED0302234562', bankAccountName: 'LOTTE CINEMA VIỆT NAM', bankAccountNumber: '0031000222222', bankName: 'Techcombank', bankCode: 'TCB', commissionRate: 0.1, lat: 10.8014, lng: 106.7314, desc: 'Rạp chiếu phim Lotte tọa lạc tại khu vực quận 2 TP. HCM.', facilities: ['parking', 'food_court', 'atm'] },
    { name: 'Galaxy Cinema Đà Nẵng', address: '116 Nguyễn Văn Linh, Hải Châu', city: 'Đà Nẵng', phone: '1900222401', email: `galaxy.danang@${DOMAIN}`, taxCode: 'SEED0401234563', bankAccountName: 'GALAXY STUDIO VIỆT NAM', bankAccountNumber: '0041000333333', bankName: 'BIDV', bankCode: 'BIDV', commissionRate: 0.1, lat: 16.0544, lng: 108.2022, desc: 'Galaxy Cinema — trải nghiệm điện ảnh đỉnh cao tại Đà Nẵng.', facilities: ['parking', 'food_court'] },
    { name: 'BHD Star Phạm Ngọc Thạch', address: 'Vincom Center, 191 Phạm Ngọc Thạch, Q.3', city: 'TP. Hồ Chí Minh', phone: '1900222402', email: `bhd.hcm@${DOMAIN}`, taxCode: 'SEED0501234564', bankAccountName: 'BHD STAR CINEMA', bankAccountNumber: '0051000444444', bankName: 'MB Bank', bankCode: 'MB', commissionRate: 0.12, lat: 10.777, lng: 106.6976, desc: 'BHD Star — phòng chiếu VIP đẳng cấp tại TP. HCM.', facilities: ['parking', 'food_court', 'atm', 'vip_lounge'] },
    { name: 'Cinestar Hai Bà Trưng', address: '135 Hai Bà Trưng, Quận 1', city: 'TP. Hồ Chí Minh', phone: '02838221234', email: `cinestar.hbt@${DOMAIN}`, taxCode: 'SEED0601234565', bankAccountName: 'CINESTAR VIỆT NAM', bankAccountNumber: '0061000555555', bankName: 'Agribank', bankCode: 'AGR', commissionRate: 0.09, lat: 10.7893, lng: 106.6987, desc: 'Cinestar — rạp chiếu phim với giá vé phải chăng, chất lượng tốt.', facilities: ['parking', 'food_court'] },
];
const MOVIE_TEMPLATES = [
    // Partner 0 — CGV (indices 0-3)
    { title: 'Lật Mặt 7: Một Điều Ước', altTitle: 'Face Off 7', desc: 'Bộ phim hài hước về gia đình và những điều ước ngây thơ của trẻ em trong dịp Tết.', genre: ['Comedy', 'Family', 'Drama'], lang: 'Tiếng Việt', dur: 128, relDaysAgo: 60, endDaysLater: 30, rating: 'P', country: 'Việt Nam', year: 2024, director: 'Lý Hải', tags: ['comedy', 'family', 'vietnamese'], poster: 'https://placehold.co/500x750/FF6B6B/white?text=Lat+Mat+7', cats: ['cat_comedy', 'cat_drama'] },
    { title: 'Đất Rừng Phương Nam', altTitle: 'Land of the Southern Forest', desc: 'Chuyến hành trình của cậu bé An ở vùng đất Nam Bộ, chuyển thể từ tiểu thuyết kinh điển của Đoàn Giỏi.', genre: ['Adventure', 'Drama', 'Historical'], lang: 'Tiếng Việt', dur: 135, relDaysAgo: 180, endDaysLater: 10, rating: 'P', country: 'Việt Nam', year: 2023, director: 'Nguyễn Quang Dũng', tags: ['historical', 'vietnamese'], poster: 'https://placehold.co/500x750/2ECC71/white?text=Dat+Rung', cats: ['cat_drama'] },
    { title: 'Avengers: Endgame', altTitle: null, desc: 'Sau sự kiện Infinity War, các Avengers còn sống phải đoàn kết để đảo ngược những gì Thanos đã làm.', genre: ['Action', 'Sci-Fi', 'Adventure'], lang: 'Tiếng Anh', dur: 181, relDaysAgo: 1800, endDaysLater: 60, rating: 'K13', country: 'Mỹ', year: 2019, director: 'Anthony & Joe Russo', tags: ['marvel', 'superhero'], poster: 'https://placehold.co/500x750/3498DB/white?text=Avengers', cats: ['cat_action', 'cat_scifi'] },
    { title: 'John Wick: Chapter 4', altTitle: null, desc: 'John Wick tìm cách thoát khỏi Hội Đồng và đối mặt với kẻ thù nguy hiểm nhất từ trước đến nay.', genre: ['Action', 'Thriller', 'Crime'], lang: 'Tiếng Anh', dur: 169, relDaysAgo: 365, endDaysLater: 30, rating: 'K18', country: 'Mỹ', year: 2023, director: 'Chad Stahelski', tags: ['action', 'thriller'], poster: 'https://placehold.co/500x750/E74C3C/white?text=John+Wick+4', cats: ['cat_action', 'cat_thriller'] },
    // Partner 1 — Lotte (indices 4-7)
    { title: 'Mai', altTitle: null, desc: 'Câu chuyện tình yêu của Mai và Dương — hai người từ hai thế giới khác nhau gặp nhau đúng lúc.', genre: ['Romance', 'Drama'], lang: 'Tiếng Việt', dur: 134, relDaysAgo: 90, endDaysLater: 20, rating: 'K16', country: 'Việt Nam', year: 2024, director: 'Trấn Thành', tags: ['romance', 'vietnamese'], poster: 'https://placehold.co/500x750/E91E63/white?text=Mai', cats: ['cat_romance', 'cat_drama'] },
    { title: 'Gái Già Lắm Chiêu 5', altTitle: 'Scheming Women 5', desc: 'Phần tiếp theo của series hài hước về những cô gái mưu mô với nhiều tình huống bi hài mới.', genre: ['Comedy', 'Drama'], lang: 'Tiếng Việt', dur: 110, relDaysAgo: 45, endDaysLater: 45, rating: 'P', country: 'Việt Nam', year: 2024, director: 'Bảo Nhân', tags: ['comedy', 'vietnamese'], poster: 'https://placehold.co/500x750/FF9800/white?text=Gai+Gia+5', cats: ['cat_comedy'] },
    { title: 'Deadpool & Wolverine', altTitle: null, desc: 'Wade Wilson và Wolverine hợp tác cứu thế giới Marvel trong chuyến phiêu lưu hài hước và hành động.', genre: ['Action', 'Comedy', 'Superhero'], lang: 'Tiếng Anh', dur: 127, relDaysAgo: 60, endDaysLater: 30, rating: 'K18', country: 'Mỹ', year: 2024, director: 'Shawn Levy', tags: ['marvel', 'action', 'comedy'], poster: 'https://placehold.co/500x750/9C27B0/white?text=Deadpool', cats: ['cat_action', 'cat_comedy'] },
    { title: 'Dune: Part Two', altTitle: null, desc: 'Paul Atreides đoàn kết với người Fremen để trả thù những kẻ đã tiêu diệt gia đình mình trên hành tinh Arrakis.', genre: ['Sci-Fi', 'Adventure', 'Drama'], lang: 'Tiếng Anh', dur: 166, relDaysAgo: 90, endDaysLater: 30, rating: 'K13', country: 'Mỹ', year: 2024, director: 'Denis Villeneuve', tags: ['sci-fi', 'epic'], poster: 'https://placehold.co/500x750/795548/white?text=Dune+2', cats: ['cat_scifi', 'cat_drama'] },
    // Partner 2 — Galaxy (indices 8-11)
    { title: 'Thiên Thần Hộ Mệnh', altTitle: 'Guardian Angel', desc: 'Bộ phim kinh dị tâm lý về một cô gái bị ám bởi linh hồn bí ẩn với nhiều tình tiết rùng rợn.', genre: ['Horror', 'Thriller', 'Mystery'], lang: 'Tiếng Việt', dur: 105, relDaysAgo: 120, endDaysLater: 10, rating: 'K18', country: 'Việt Nam', year: 2023, director: 'Victor Vũ', tags: ['horror', 'vietnamese'], poster: 'https://placehold.co/500x750/37474F/white?text=Thien+Than', cats: ['cat_horror', 'cat_thriller'] },
    { title: 'Em và Trịnh', altTitle: 'Trinh and Me', desc: 'Tiểu sử điện ảnh về cuộc đời đầy xúc cảm và những mối tình của nhạc sĩ Trịnh Công Sơn.', genre: ['Drama', 'Romance', 'Biographical'], lang: 'Tiếng Việt', dur: 137, relDaysAgo: 730, endDaysLater: 20, rating: 'P', country: 'Việt Nam', year: 2022, director: 'Phan Gia Nhật Linh', tags: ['biographical', 'music', 'vietnamese'], poster: 'https://placehold.co/500x750/00BCD4/white?text=Em+va+Trinh', cats: ['cat_romance', 'cat_drama'] },
    { title: 'Oppenheimer', altTitle: null, desc: 'Câu chuyện sử thi về J. Robert Oppenheimer, cha đẻ của bom nguyên tử trong Thế Chiến II.', genre: ['Drama', 'Historical', 'Thriller'], lang: 'Tiếng Anh', dur: 180, relDaysAgo: 300, endDaysLater: 30, rating: 'K13', country: 'Mỹ', year: 2023, director: 'Christopher Nolan', tags: ['historical', 'nolan'], poster: 'https://placehold.co/500x750/FF5722/white?text=Oppenheimer', cats: ['cat_drama', 'cat_thriller'] },
    { title: 'Spider-Man: No Way Home', altTitle: null, desc: 'Peter Parker tìm đến Doctor Strange để xóa bí mật, vô tình mở ra cánh cửa đa vũ trụ.', genre: ['Action', 'Adventure', 'Sci-Fi'], lang: 'Tiếng Anh', dur: 148, relDaysAgo: 900, endDaysLater: 30, rating: 'K13', country: 'Mỹ', year: 2021, director: 'Jon Watts', tags: ['marvel', 'spider-man'], poster: 'https://placehold.co/500x750/1565C0/white?text=Spider-Man+NWH', cats: ['cat_action', 'cat_scifi'] },
    // Partner 3 — BHD (indices 12-15)
    { title: 'Bố Già', altTitle: "Dad, I'm Sorry", desc: 'Phim hài - tâm lý về mối quan hệ cha con phức tạp trong gia đình người Việt hiện đại.', genre: ['Comedy', 'Drama', 'Family'], lang: 'Tiếng Việt', dur: 127, relDaysAgo: 1100, endDaysLater: 20, rating: 'P', country: 'Việt Nam', year: 2021, director: 'Trấn Thành', tags: ['comedy', 'family', 'vietnamese'], poster: 'https://placehold.co/500x750/8D6E63/white?text=Bo+Gia', cats: ['cat_comedy', 'cat_drama'] },
    { title: 'Mắt Biếc', altTitle: 'Dreamy Eyes', desc: 'Chuyện tình đẹp buồn giữa Ngạn và Hà Lan từ thuở thiếu niên đến trưởng thành.', genre: ['Romance', 'Drama'], lang: 'Tiếng Việt', dur: 118, relDaysAgo: 1500, endDaysLater: 15, rating: 'P', country: 'Việt Nam', year: 2019, director: 'Victor Vũ', tags: ['romance', 'vietnamese', 'classic'], poster: 'https://placehold.co/500x750/4CAF50/white?text=Mat+Biec', cats: ['cat_romance'] },
    { title: 'The Batman', altTitle: null, desc: 'Batman trẻ đương đầu với Riddler — kẻ giết người hàng loạt có mục tiêu phơi bày sự thối nát của Gotham City.', genre: ['Action', 'Crime', 'Thriller'], lang: 'Tiếng Anh', dur: 176, relDaysAgo: 730, endDaysLater: 30, rating: 'K13', country: 'Mỹ', year: 2022, director: 'Matt Reeves', tags: ['dc', 'batman'], poster: 'https://placehold.co/500x750/212121/white?text=The+Batman', cats: ['cat_action', 'cat_thriller'] },
    { title: 'Mission: Impossible – Dead Reckoning', altTitle: null, desc: 'Ethan Hunt đối mặt với AI nguy hiểm nhất trong sứ mệnh tưởng chừng không thể hoàn thành.', genre: ['Action', 'Adventure', 'Thriller'], lang: 'Tiếng Anh', dur: 163, relDaysAgo: 300, endDaysLater: 30, rating: 'K13', country: 'Mỹ', year: 2023, director: 'Christopher McQuarrie', tags: ['action', 'mission-impossible'], poster: 'https://placehold.co/500x750/F44336/white?text=MI+DR', cats: ['cat_action', 'cat_thriller'] },
    // Partner 4 — Cinestar (indices 16-19)
    { title: 'Trạng Tí Phiêu Lưu Ký', altTitle: 'Adventures of Trang Ti', desc: 'Hành trình phiêu lưu hài hước của chú bé Trạng Tí thông minh trong thời trung đại Việt Nam.', genre: ['Animation', 'Adventure', 'Family'], lang: 'Tiếng Việt', dur: 90, relDaysAgo: 700, endDaysLater: 20, rating: 'P', country: 'Việt Nam', year: 2021, director: 'Phan Gia Nhật Linh', tags: ['animation', 'family', 'vietnamese'], poster: 'https://placehold.co/500x750/FFEB3B/333?text=Trang+Ti', cats: ['cat_animation'] },
    { title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', altTitle: 'Yellow Flowers on the Green Grass', desc: 'Câu chuyện tuổi thơ ngọt ngào và đầy xúc cảm của hai anh em Thiều và Tường ở làng quê Việt Nam.', genre: ['Drama', 'Family'], lang: 'Tiếng Việt', dur: 104, relDaysAgo: 3000, endDaysLater: 30, rating: 'P', country: 'Việt Nam', year: 2015, director: 'Victor Vũ', tags: ['family', 'vietnamese', 'classic'], poster: 'https://placehold.co/500x750/8BC34A/white?text=Hoa+Vang', cats: ['cat_drama'] },
    { title: 'Interstellar', altTitle: null, desc: 'Một nhóm phi hành gia du hành qua lỗ sâu không gian để tìm kiếm hành tinh mới cho nhân loại.', genre: ['Sci-Fi', 'Drama', 'Adventure'], lang: 'Tiếng Anh', dur: 169, relDaysAgo: 3650, endDaysLater: 60, rating: 'P', country: 'Mỹ', year: 2014, director: 'Christopher Nolan', tags: ['sci-fi', 'nolan', 'space'], poster: 'https://placehold.co/500x750/1A237E/white?text=Interstellar', cats: ['cat_scifi', 'cat_drama'] },
    { title: 'Top Gun: Maverick', altTitle: null, desc: '"Maverick" Mitchell huấn luyện thế hệ phi công mới cho nhiệm vụ tối mật đầy nguy hiểm.', genre: ['Action', 'Drama'], lang: 'Tiếng Anh', dur: 130, relDaysAgo: 700, endDaysLater: 30, rating: 'P', country: 'Mỹ', year: 2022, director: 'Joseph Kosinski', tags: ['action', 'aviation', 'tom-cruise'], poster: 'https://placehold.co/500x750/0288D1/white?text=Top+Gun', cats: ['cat_action', 'cat_drama'] },
];
const CAST_DATA = [
    [{ name: 'Lý Hải', role: 'Đạo diễn / Vai chính', order: 1 }, { name: 'Minh Hà', role: 'Vai nữ chính', order: 2 }, { name: 'Trung Dân', role: 'Vai phụ', order: 3 }],
    [{ name: 'Hạo Khang', role: 'An (nhân vật chính)', order: 1 }, { name: 'Tuấn Trần', role: 'Tứ Cân', order: 2 }, { name: 'Mai Tài Phến', role: 'Út Lục Lâm', order: 3 }],
    [{ name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man', order: 1 }, { name: 'Chris Evans', role: 'Steve Rogers / Captain America', order: 2 }, { name: 'Scarlett Johansson', role: 'Natasha Romanoff / Black Widow', order: 3 }],
    [{ name: 'Keanu Reeves', role: 'John Wick', order: 1 }, { name: 'Donnie Yen', role: 'Caine', order: 2 }, { name: 'Bill Skarsgård', role: 'Marquis Vincent de Gramont', order: 3 }],
    [{ name: 'Phương Anh Đào', role: 'Mai', order: 1 }, { name: 'Tuấn Trần', role: 'Dương', order: 2 }, { name: 'Trấn Thành', role: 'Vai khách mời', order: 3 }],
    [{ name: 'Ninh Dương Lan Ngọc', role: 'Vai nữ chính', order: 1 }, { name: 'Thu Trang', role: 'Chị cả', order: 2 }, { name: 'Khả Như', role: 'Em út', order: 3 }],
    [{ name: 'Ryan Reynolds', role: 'Wade Wilson / Deadpool', order: 1 }, { name: 'Hugh Jackman', role: 'Logan / Wolverine', order: 2 }, { name: 'Emma Corrin', role: 'Cassandra Nova', order: 3 }],
    [{ name: 'Timothée Chalamet', role: 'Paul Atreides', order: 1 }, { name: 'Zendaya', role: 'Chani', order: 2 }, { name: 'Austin Butler', role: 'Feyd-Rautha Harkonnen', order: 3 }],
    [{ name: 'Diễm My 9x', role: 'Vai nữ chính', order: 1 }, { name: 'Quang Tuấn', role: 'Vai nam chính', order: 2 }, { name: 'Lê Giang', role: 'Vai phụ', order: 3 }],
    [{ name: 'Avin Lu', role: 'Trịnh Công Sơn (trẻ)', order: 1 }, { name: 'Bùi Lan Hương', role: 'Michiko Yoshii', order: 2 }, { name: 'Hoàng Hà', role: 'Dao Ánh', order: 3 }],
    [{ name: 'Cillian Murphy', role: 'J. Robert Oppenheimer', order: 1 }, { name: 'Emily Blunt', role: 'Katherine Oppenheimer', order: 2 }, { name: 'Matt Damon', role: 'General Leslie Groves', order: 3 }],
    [{ name: 'Tom Holland', role: 'Peter Parker / Spider-Man', order: 1 }, { name: 'Zendaya', role: 'MJ', order: 2 }, { name: 'Benedict Cumberbatch', role: 'Doctor Strange', order: 3 }],
    [{ name: 'Trấn Thành', role: 'Ba Sang', order: 1 }, { name: 'Tuấn Trần', role: 'Con trai', order: 2 }, { name: 'Ngân Chi', role: 'Vợ', order: 3 }],
    [{ name: 'Trần Nghĩa', role: 'Ngạn', order: 1 }, { name: 'Trúc Anh', role: 'Hà Lan', order: 2 }, { name: 'Phan Mạnh Quỳnh', role: 'Dũng', order: 3 }],
    [{ name: 'Robert Pattinson', role: 'Bruce Wayne / The Batman', order: 1 }, { name: 'Zoë Kravitz', role: 'Selina Kyle / Catwoman', order: 2 }, { name: 'Paul Dano', role: 'Edward Nashton / The Riddler', order: 3 }],
    [{ name: 'Tom Cruise', role: 'Ethan Hunt', order: 1 }, { name: 'Hayley Atwell', role: 'Grace', order: 2 }, { name: 'Ving Rhames', role: 'Luther Stickell', order: 3 }],
    [{ name: 'Hữu Tiến', role: 'Trạng Tí (lồng tiếng)', order: 1 }, { name: 'Thái Hòa', role: 'Nhân vật (lồng tiếng)', order: 2 }, { name: 'Hoài Linh', role: 'Vai khách mời', order: 3 }],
    [{ name: 'Thiên An', role: 'Thiều', order: 1 }, { name: 'Hữu Khang', role: 'Tường', order: 2 }, { name: 'Phương Nguyên', role: 'Mận', order: 3 }],
    [{ name: 'Matthew McConaughey', role: 'Cooper', order: 1 }, { name: 'Anne Hathaway', role: 'Brand', order: 2 }, { name: 'Jessica Chastain', role: 'Murph (adult)', order: 3 }],
    [{ name: 'Tom Cruise', role: 'Pete "Maverick" Mitchell', order: 1 }, { name: 'Miles Teller', role: 'Bradley "Rooster" Bradshaw', order: 2 }, { name: 'Jennifer Connelly', role: 'Penny Benjamin', order: 3 }],
];
const REVIEW_CONTENTS = [
    'Phim hay, nội dung sâu sắc! Rất đáng xem.',
    'Hình ảnh đẹp, âm nhạc tuyệt vời. Diễn xuất ấn tượng.',
    'Cốt truyện hấp dẫn, không đoán được kết thúc. Xuất sắc!',
    'Một tác phẩm điện ảnh xuất sắc. Xúc động từ đầu đến cuối.',
    'Đã xem 2 lần rồi vẫn muốn xem nữa. Tuyệt vời!',
    'Diễn viên diễn xuất đỉnh, cảnh quay mãn nhãn.',
    'Kịch bản thông minh, nhiều twist bất ngờ. Cực kỳ cuốn hút.',
    'Phim tạm, không như kỳ vọng nhưng vẫn đáng xem một lần.',
    'Hài hước và cảm động. Phù hợp cho cả gia đình.',
    'Chất lượng hình ảnh và âm thanh rất tốt. Nội dung ổn.',
];
const USER_NAMES = ['Nguyễn Văn An', 'Trần Thị Bình', 'Phạm Hữu Cường', 'Lê Thị Dung', 'Hoàng Văn Em', 'Vũ Thị Phương', 'Đặng Minh Khoa', 'Bùi Thị Lan', 'Đỗ Văn Mạnh', 'Cao Thị Nga', 'Đinh Văn Phúc', 'Hồ Thị Quỳnh', 'Tô Văn Sơn', 'Ngô Thị Thủy', 'Dương Văn Uy', 'Lâm Thị Vân', 'Trịnh Văn Wai', 'Phan Thị Xuân', 'Mai Văn Yên', 'Tạ Thị Zung', 'Nguyễn Hữu Anh', 'Trần Minh Bảo', 'Phạm Thị Cẩm', 'Lê Văn Đức', 'Hoàng Thị Ên', 'Vũ Hữu Phong', 'Đặng Thị Giang', 'Bùi Văn Hùng', 'Đỗ Thị Iris', 'Cao Văn Khải'];
// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🎬 CinePass seed bắt đầu...\n');
    const seedPass = await bcrypt.hash('Cinepass@2025', 10);
    // ① Clean seed data từ lần trước
    console.log('🧹 Xóa seed data cũ...');
    await prisma.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
    await prisma.category.deleteMany({ where: { id: { startsWith: 'cat_' } } });
    // ── Pre-generate IDs ─────────────────────────────────────────────────────────
    const adminId = uid();
    const partnerUserIds = Array.from({ length: 5 }, () => uid());
    const regularUserIds = Array.from({ length: 30 }, () => uid());
    const partnerIds = Array.from({ length: 5 }, () => uid());
    const roomIds = Array.from({ length: 15 }, () => uid()); // 3 per partner
    const movieIds = Array.from({ length: 20 }, () => uid()); // 4 per partner
    const showtimeIds = Array.from({ length: 40 }, () => uid()); // 2 per movie
    // ── 1. Users ─────────────────────────────────────────────────────────────────
    console.log('👤 Tạo 36 users...');
    const allUserIds = [adminId, ...partnerUserIds, ...regularUserIds];
    await prisma.user.createMany({
        data: [
            {
                id: adminId,
                email: `admin@${DOMAIN}`,
                username: 'seed_admin',
                name: 'Admin CinePass',
                password: seedPass,
                role: client_1.Role.ADMIN,
                status: client_1.UserStatus.ACTIVE,
                emailVerified: true,
                provider: 'local',
                phone: '0901234567',
                location: 'Hà Nội',
            },
            ...partnerUserIds.map((id, i) => ({
                id,
                email: `partner${i + 1}@${DOMAIN}`,
                username: `seed_partner_${i + 1}`,
                name: `Đối Tác ${CINEMA_DATA[i].name.split(' ')[0]} ${i + 1}`,
                password: seedPass,
                role: client_1.Role.PARTNER,
                status: client_1.UserStatus.ACTIVE,
                emailVerified: true,
                provider: 'local',
                phone: `090${String(i + 1).padStart(7, '0')}`,
                location: CINEMA_DATA[i].city,
            })),
            ...regularUserIds.map((id, i) => ({
                id,
                email: `user${i + 1}@${DOMAIN}`,
                username: `seed_user_${i + 1}`,
                name: USER_NAMES[i],
                password: seedPass,
                role: client_1.Role.USER,
                status: i < 25 ? client_1.UserStatus.ACTIVE : client_1.UserStatus.INACTIVE,
                emailVerified: i < 28,
                provider: 'local',
                phone: `09${r(10000000, 99999999)}`,
                location: pick(['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ']),
                bio: i % 3 === 0 ? pick(['Yêu thích điện ảnh 🎬', 'Cinephile | Always looking for great films', 'Movie enthusiast 🍿']) : null,
            })),
        ],
        skipDuplicates: true,
    });
    await prisma.userSetting.createMany({
        data: allUserIds.map((userId) => ({
            id: uid(),
            userId,
            notifications: true,
            marketingEmails: false,
            pushNotifications: true,
            smsNotifications: false,
            shareHistory: false,
            personalizedRecs: true,
        })),
        skipDuplicates: true,
    });
    // ── 2. Partners ───────────────────────────────────────────────────────────────
    console.log('🏢 Tạo 5 partners...');
    const repNames = ['Nguyễn Văn Anh', 'Trần Thị Bảo', 'Phạm Hữu Châu', 'Lê Thị Duyên', 'Hoàng Văn Ên'];
    await prisma.partner.createMany({
        data: CINEMA_DATA.map((c, i) => ({
            id: partnerIds[i],
            userId: partnerUserIds[i],
            cinemaName: c.name,
            address: c.address,
            city: c.city,
            country: 'Việt Nam',
            phone: c.phone,
            email: c.email,
            taxCode: c.taxCode,
            bankAccountName: c.bankAccountName,
            bankAccountNumber: c.bankAccountNumber,
            bankName: c.bankName,
            bankCode: c.bankCode,
            commissionRate: c.commissionRate,
            status: client_1.PartnerStatus.ACTIVE,
            approvedAt: daysAgo(r(60, 180)),
            approvedBy: adminId,
            lat: c.lat,
            lng: c.lng,
            description: c.desc,
            facilities: c.facilities,
            representativeName: repNames[i],
            representativeIdNumber: `00109901234${i}`,
        })),
        skipDuplicates: true,
    });
    await prisma.partnerWallet.createMany({
        data: partnerIds.map((partnerId) => ({
            id: uid(),
            partnerId,
            balance: r(5000000, 50000000),
            totalEarned: r(100000000, 500000000),
            totalWithdrawn: r(20000000, 100000000),
            totalRefunded: r(0, 5000000),
        })),
        skipDuplicates: true,
    });
    // ── 3. Partner Requests (approved) ────────────────────────────────────────────
    console.log('📋 Tạo 5 partner requests...');
    await prisma.partnerRequest.createMany({
        data: CINEMA_DATA.map((c, i) => ({
            id: uid(),
            userId: partnerUserIds[i],
            cinemaName: c.name,
            address: c.address,
            city: c.city,
            phone: c.phone,
            email: c.email,
            taxCode: c.taxCode,
            businessLicense: `GP-BVHTTDL-2023-00${i + 1}`,
            businessLicenseFile: 'https://placehold.co/600x400/eee/999?text=License',
            representativeName: repNames[i],
            representativeIdNumber: `00109901234${i}`,
            representativeIdFile: 'https://placehold.co/600x400/eee/999?text=ID',
            taxCertificateFile: 'https://placehold.co/600x400/eee/999?text=TaxCert',
            bankAccountName: c.bankAccountName,
            bankAccountNumber: c.bankAccountNumber,
            bankName: c.bankName,
            status: client_1.PartnerRequestStatus.APPROVED,
            reviewedBy: adminId,
            reviewedAt: daysAgo(r(60, 180)),
            approvedPartnerId: partnerIds[i],
        })),
        skipDuplicates: true,
    });
    // ── 4. Categories ─────────────────────────────────────────────────────────────
    console.log('🎭 Tạo 8 categories...');
    await prisma.category.createMany({
        data: [
            { id: 'cat_action', name: 'Hành Động', slug: 'hanh-dong', description: 'Phim hành động, võ thuật, phiêu lưu', status: client_1.ModelStatus.active, position: 1 },
            { id: 'cat_comedy', name: 'Hài Hước', slug: 'hai-huoc', description: 'Phim hài, giải trí', status: client_1.ModelStatus.active, position: 2 },
            { id: 'cat_drama', name: 'Tâm Lý', slug: 'tam-ly', description: 'Phim tâm lý, chính kịch', status: client_1.ModelStatus.active, position: 3 },
            { id: 'cat_horror', name: 'Kinh Dị', slug: 'kinh-di', description: 'Phim kinh dị, ma quái', status: client_1.ModelStatus.active, position: 4 },
            { id: 'cat_scifi', name: 'Khoa Học Viễn Tưởng', slug: 'khoa-hoc-vien-tuong', description: 'Phim sci-fi, tương lai', status: client_1.ModelStatus.active, position: 5 },
            { id: 'cat_romance', name: 'Tình Cảm', slug: 'tinh-cam', description: 'Phim tình cảm, lãng mạn', status: client_1.ModelStatus.active, position: 6 },
            { id: 'cat_animation', name: 'Hoạt Hình', slug: 'hoat-hinh', description: 'Phim hoạt hình, animation', status: client_1.ModelStatus.active, position: 7 },
            { id: 'cat_thriller', name: 'Hồi Hộp', slug: 'hoi-hop', description: 'Phim hồi hộp, ly kỳ', status: client_1.ModelStatus.active, position: 8 },
        ],
        skipDuplicates: true,
    });
    // ── 5. Rooms (3 per partner = 15) ─────────────────────────────────────────────
    console.log('🎪 Tạo 15 rooms...');
    const roomConfigs = [
        {
            name: 'Phòng 1 — 2D Standard',
            type: client_1.RoomType.TWO_D,
            rows: 8, seatsPerRow: 12,
            tech: ['Dolby Digital', '2K Projection'],
            screenWidth: 14.0, screenHeight: 7.0,
            screenPos: 'FRONT', aspectRatio: '2.35:1',
            entrancePos: 'REAR', aislePos: 'CENTER',
            layoutSeat: Array.from({ length: 8 }, (_, ri) => Array.from({ length: 12 }, () => ri >= 6 ? 2 : 1)),
            maxSeatsPerTransaction: 8,
        },
        {
            name: 'Phòng 2 — 3D',
            type: client_1.RoomType.THREE_D,
            rows: 6, seatsPerRow: 10,
            tech: ['Dolby Atmos', '3D', '4K Laser'],
            screenWidth: 12.0, screenHeight: 6.5,
            screenPos: 'FRONT', aspectRatio: '1.85:1',
            entrancePos: 'REAR', aislePos: 'CENTER',
            layoutSeat: Array.from({ length: 6 }, (_, ri) => Array.from({ length: 10 }, () => ri >= 4 ? 2 : 1)),
            maxSeatsPerTransaction: 8,
        },
        {
            name: 'Phòng VIP',
            type: client_1.RoomType.VIP,
            rows: 4, seatsPerRow: 6,
            tech: ['Dolby Atmos', '4K HDR', 'Premium Leather'],
            screenWidth: 10.0, screenHeight: 5.5,
            screenPos: 'FRONT', aspectRatio: '2.35:1',
            entrancePos: 'REAR', aislePos: 'SIDE',
            layoutSeat: Array.from({ length: 4 }, () => Array(6).fill(2)),
            maxSeatsPerTransaction: 4,
        },
    ];
    await prisma.room.createMany({
        data: partnerIds.flatMap((partnerId, pi) => roomConfigs.map((cfg, ri) => ({
            id: roomIds[pi * 3 + ri],
            partnerId,
            name: cfg.name,
            type: cfg.type,
            status: client_1.RoomStatus.ACTIVE,
            rows: cfg.rows,
            seatsPerRow: cfg.seatsPerRow,
            tech: cfg.tech,
            screenWidth: cfg.screenWidth,
            screenHeight: cfg.screenHeight,
            screenPos: cfg.screenPos,
            aspectRatio: cfg.aspectRatio,
            entrancePos: cfg.entrancePos,
            aislePos: cfg.aislePos,
            layoutSeat: cfg.layoutSeat,
            allowOnlineBooking: true,
            allowSeatSelection: true,
            maxBookingDays: 14,
            maxSeatsPerTransaction: cfg.maxSeatsPerTransaction,
        }))),
        skipDuplicates: true,
    });
    // ── 6. Services + RoomServices ────────────────────────────────────────────────
    console.log('🍿 Tạo 15 services...');
    const serviceDefs = [
        { name: 'Bỏng ngô vừa', price: 35000, category: 'food', icon: '🍿', description: 'Bỏng ngô bơ thơm ngon' },
        { name: 'Nước ngọt lớn', price: 28000, category: 'drinks', icon: '🥤', description: 'Coca-Cola / Pepsi size L' },
        { name: 'Combo đôi', price: 75000, category: 'combo', icon: '🎁', description: '2 bỏng vừa + 2 nước lớn' },
    ];
    const createdServiceIds = [];
    for (let pi = 0; pi < 5; pi++) {
        for (const svc of serviceDefs) {
            const s = await prisma.service.create({
                data: { ...svc, partnerId: partnerIds[pi] },
                select: { id: true },
            });
            createdServiceIds.push({ id: s.id, partnerIdx: pi });
        }
    }
    // Link 2 services per room
    for (let pi = 0; pi < 5; pi++) {
        const svcs = createdServiceIds.filter((s) => s.partnerIdx === pi);
        for (let ri = 0; ri < 3; ri++) {
            const roomId = roomIds[pi * 3 + ri];
            for (const svc of svcs.slice(0, 2)) {
                await prisma.roomService.upsert({
                    where: { roomId_serviceId: { roomId, serviceId: svc.id } },
                    create: { id: uid(), roomId, serviceId: svc.id },
                    update: {},
                });
            }
        }
    }
    // ── 7. Movies (4 per partner = 20) ────────────────────────────────────────────
    console.log('🎬 Tạo 20 movies...');
    for (let i = 0; i < 20; i++) {
        const t = MOVIE_TEMPLATES[i];
        const partnerIdx = Math.floor(i / 4);
        await prisma.movie.create({
            data: {
                id: movieIds[i],
                partnerId: partnerIds[partnerIdx],
                title: t.title,
                altTitle: t.altTitle ?? undefined,
                description: t.desc,
                genre: t.genre,
                language: t.lang,
                duration: t.dur,
                releaseDate: daysAgo(t.relDaysAgo),
                endDate: daysLater(t.endDaysLater),
                posterUrl: t.poster,
                rating: t.rating,
                status: client_1.MovieStatus.ACTIVE,
                publishedAt: daysAgo(t.relDaysAgo),
                country: t.country,
                year: t.year,
                director: t.director,
                tags: t.tags,
                allowComments: true,
                categories: { connect: t.cats.map((id) => ({ id })) },
            },
        });
    }
    // ── 8. Casts (3 per movie = 60) ───────────────────────────────────────────────
    console.log('🎭 Tạo 60 cast...');
    await prisma.cast.createMany({
        data: CAST_DATA.flatMap((casts, mi) => casts.map((c) => ({ id: uid(), movieId: movieIds[mi], ...c }))),
    });
    // ── 9. Showtimes (2 per movie = 40) ──────────────────────────────────────────
    console.log('🎟 Tạo 40 showtimes...');
    const SEATS_PER_SHOWTIME = 10; // 2 rows × 5 cols
    for (let mi = 0; mi < 20; mi++) {
        const pi = Math.floor(mi / 4);
        const partnerId = partnerIds[pi];
        const room2D = roomIds[pi * 3 + 0];
        const room3D = roomIds[pi * 3 + 1];
        const dur = MOVIE_TEMPLATES[mi].dur;
        const pastStart = daysAgo(r(10, 60));
        const futureStart = daysLater(r(3, 30));
        await prisma.showtime.createMany({
            data: [
                {
                    id: showtimeIds[mi * 2],
                    movieId: movieIds[mi],
                    partnerId,
                    roomId: room2D,
                    startTime: pastStart,
                    endTime: addHours(pastStart, Math.ceil(dur / 60) + 1),
                    basePrice: 80000,
                    priceConfig: { STANDARD: 80000, VIP: 120000 },
                    status: client_1.ShowtimeStatus.ENDED,
                    totalSeats: SEATS_PER_SHOWTIME,
                    availableSeats: SEATS_PER_SHOWTIME,
                    bookedSeats: 0,
                },
                {
                    id: showtimeIds[mi * 2 + 1],
                    movieId: movieIds[mi],
                    partnerId,
                    roomId: room3D,
                    startTime: futureStart,
                    endTime: addHours(futureStart, Math.ceil(dur / 60) + 1),
                    basePrice: 95000,
                    priceConfig: { STANDARD: 95000, VIP: 145000 },
                    status: client_1.ShowtimeStatus.SCHEDULED,
                    totalSeats: SEATS_PER_SHOWTIME,
                    availableSeats: SEATS_PER_SHOWTIME,
                    bookedSeats: 0,
                },
            ],
        });
    }
    // ── 10. Seats (10 per showtime = 400) ────────────────────────────────────────
    console.log('💺 Tạo 400 seats...');
    const seatMap = new Map();
    const allSeats = [];
    for (const stId of showtimeIds) {
        const stSeats = [];
        for (const row of ['A', 'B']) {
            for (let col = 1; col <= 5; col++) {
                const seatId = uid();
                const seatType = row === 'B' ? client_1.SeatType.VIP : client_1.SeatType.STANDARD;
                const price = seatType === client_1.SeatType.VIP ? 120000 : 80000;
                allSeats.push({ id: seatId, showtimeId: stId, seatNumber: `${row}${col}`, rowLabel: row, columnNumber: col, seatType, status: client_1.SeatStatus.AVAILABLE, price });
                stSeats.push({ id: seatId, seatNumber: `${row}${col}`, price, seatType });
            }
        }
        seatMap.set(stId, stSeats);
    }
    await prisma.seat.createMany({ data: allSeats });
    // ── 11. Orders & Tickets (15 orders, 2 tickets each = 30 tickets) ─────────────
    console.log('🎫 Tạo 15 orders & 30 tickets...');
    const pastShowtimeIds = showtimeIds.filter((_, i) => i % 2 === 0); // indices 0,2,4,...38
    const createdTickets = [];
    for (let oi = 0; oi < 15; oi++) {
        const stId = pastShowtimeIds[oi];
        const mi = oi; // movie index = order index (one order per first 15 past showtimes)
        const pi = Math.floor(mi / 4);
        const partnerId = partnerIds[pi];
        const userId = regularUserIds[oi % 20];
        const seats = seatMap.get(stId);
        const pickedSeats = seats.slice(0, 2); // A1 + A2
        const basePrice = pickedSeats[0].price;
        const totalAmount = basePrice * 2;
        const orderId = uid();
        const isUsed = oi < 10;
        await prisma.order.create({
            data: {
                id: orderId,
                userId,
                showtimeId: stId,
                partnerId,
                status: client_1.OrderStatus.COMPLETED,
                totalAmount,
                discountAmount: 0,
                finalAmount: totalAmount,
                expiresAt: daysAgo(r(5, 30)),
            },
        });
        for (const seat of pickedSeats) {
            const ticketId = uid();
            const commission = 0.1;
            const partnerAmount = Math.floor(seat.price * (1 - commission));
            const platformFee = seat.price - partnerAmount;
            const purchasedAt = daysAgo(r(5, 30));
            const ticketStatus = isUsed ? client_1.TicketStatus.USED : client_1.TicketStatus.CONFIRMED;
            await prisma.ticket.create({
                data: {
                    id: ticketId,
                    userId,
                    orderId,
                    showtimeId: stId,
                    partnerId,
                    movieId: movieIds[mi],
                    seatId: seat.id,
                    seatNumber: seat.seatNumber,
                    purchasePrice: seat.price,
                    partnerAmount,
                    platformFee,
                    status: ticketStatus,
                    qrCode: `CINEPASS-${uid()}`,
                    purchasedAt,
                    usedAt: isUsed ? daysAgo(r(1, 4)) : null,
                },
            });
            await prisma.seat.update({ where: { id: seat.id }, data: { status: client_1.SeatStatus.BOOKED } });
            createdTickets.push({ id: ticketId, partnerId, showtimeId: stId, userId, status: ticketStatus });
        }
        await prisma.showtime.update({
            where: { id: stId },
            data: { bookedSeats: 2, availableSeats: SEATS_PER_SHOWTIME - 2 },
        });
    }
    // ── 12. Check-ins (for USED tickets) ─────────────────────────────────────────
    console.log('✅ Tạo check-ins...');
    const usedTickets = createdTickets.filter((t) => t.status === client_1.TicketStatus.USED);
    await prisma.checkIn.createMany({
        data: usedTickets.map((t) => ({
            id: uid(),
            ticketId: t.id,
            partnerId: t.partnerId,
            showtimeId: t.showtimeId,
            userId: t.userId,
            scannedAt: daysAgo(r(1, 5)),
            scannedBy: adminId,
            ipAddress: '192.168.1.100',
            deviceInfo: 'CinePass Scanner App v2.1',
        })),
    });
    // ── 13. Reviews ───────────────────────────────────────────────────────────────
    console.log('⭐ Tạo 20 reviews...');
    await prisma.review.createMany({
        data: Array.from({ length: 20 }, (_, i) => ({
            id: uid(),
            movieId: movieIds[i],
            userId: regularUserIds[i % 29],
            score: r(3, 5),
            content: pick(REVIEW_CONTENTS),
            status: i < 16 ? client_1.ReviewStatus.APPROVED : client_1.ReviewStatus.PENDING,
            verifiedPurchase: i < 15,
            helpfulCount: r(0, 80),
        })),
    });
    // ── 14. Transactions ──────────────────────────────────────────────────────────
    console.log('💰 Tạo transactions...');
    const completedOrders = await prisma.order.findMany({
        where: { status: client_1.OrderStatus.COMPLETED },
        include: { tickets: true },
    });
    for (const order of completedOrders) {
        for (const ticket of order.tickets) {
            await prisma.transaction.createMany({
                data: [
                    {
                        id: uid(),
                        userId: order.userId,
                        partnerId: order.partnerId,
                        orderId: order.id,
                        ticketId: ticket.id,
                        type: client_1.TransactionType.TICKET_SALE,
                        status: client_1.TransactionStatus.COMPLETED,
                        amount: ticket.purchasePrice,
                        paymentMethod: pick(['PAYOS', 'MOMO', 'ZALOPAY', 'VNPAY']),
                        paymentGatewayRef: `TXN-${uid().slice(0, 12).toUpperCase()}`,
                        description: `Thanh toán vé phim — ghế ${ticket.seatNumber}`,
                    },
                    {
                        id: uid(),
                        partnerId: order.partnerId,
                        orderId: order.id,
                        ticketId: ticket.id,
                        type: client_1.TransactionType.COMMISSION_DEDUCTED,
                        status: client_1.TransactionStatus.COMPLETED,
                        amount: ticket.platformFee,
                        description: `Phí hoa hồng platform`,
                    },
                ],
            });
        }
    }
    // ── 15. Withdrawals ───────────────────────────────────────────────────────────
    console.log('🏦 Tạo 3 withdrawals...');
    const wdStatuses = [client_1.WithdrawalStatus.COMPLETED, client_1.WithdrawalStatus.PENDING, client_1.WithdrawalStatus.PROCESSING];
    await prisma.withdrawal.createMany({
        data: [0, 1, 2].map((i) => ({
            id: uid(),
            partnerId: partnerIds[i],
            amount: r(10000000, 50000000),
            bankAccountNumber: CINEMA_DATA[i].bankAccountNumber,
            bankName: CINEMA_DATA[i].bankName,
            bankCode: CINEMA_DATA[i].bankCode,
            status: wdStatuses[i],
            transactionReference: i === 0 ? `WD-${uid().slice(0, 12).toUpperCase()}` : null,
            note: i === 0 ? 'Rút tiền định kỳ tháng này' : null,
            processedAt: i === 0 ? daysAgo(r(1, 10)) : null,
            approvedBy: adminId,
        })),
    });
    // ── 16. Notifications ─────────────────────────────────────────────────────────
    console.log('🔔 Tạo 18 notifications...');
    const partnerNotifs = [
        { userId: partnerUserIds[0], type: client_1.NotificationType.PARTNER_MOVIE_APPROVED, title: 'Phim được duyệt', message: 'Phim "Lật Mặt 7" đã được admin phê duyệt và sẵn sàng bán vé.' },
        { userId: partnerUserIds[1], type: client_1.NotificationType.PARTNER_MOVIE_APPROVED, title: 'Phim được duyệt', message: 'Phim "Mai" đã được admin phê duyệt và sẵn sàng bán vé.' },
        { userId: partnerUserIds[0], type: client_1.NotificationType.PARTNER_WITHDRAWAL_COMPLETED, title: 'Rút tiền thành công', message: 'Yêu cầu rút tiền 20.000.000 VND đã hoàn tất. Kiểm tra tài khoản ngân hàng của bạn.' },
        { userId: partnerUserIds[1], type: client_1.NotificationType.PARTNER_WITHDRAWAL_PENDING, title: 'Yêu cầu rút tiền đang xử lý', message: 'Yêu cầu rút tiền đang được xử lý, vui lòng chờ 1-3 ngày làm việc.' },
        { userId: partnerUserIds[2], type: client_1.NotificationType.PARTNER_DAILY_REVENUE, title: 'Doanh thu hôm nay', message: 'Doanh thu ngày hôm nay: 5.250.000 VND từ 70 vé bán ra.' },
        { userId: partnerUserIds[3], type: client_1.NotificationType.PARTNER_MOVIE_REJECTED, title: 'Phim bị từ chối', message: 'Phim của bạn bị từ chối do thiếu thông tin. Vui lòng cập nhật và gửi lại.' },
    ];
    const userNotifs = regularUserIds.slice(0, 12).map((userId, i) => ({
        userId,
        type: i % 3 === 0 ? client_1.NotificationType.BOOKING_CONFIRMED : i % 3 === 1 ? client_1.NotificationType.BOOKING_CANCELLED : client_1.NotificationType.TICKET_REFUNDED,
        title: i % 3 === 0 ? 'Đặt vé thành công' : i % 3 === 1 ? 'Đơn hàng bị hủy' : 'Vé được hoàn tiền',
        message: i % 3 === 0
            ? `Vé của bạn đã được xác nhận. Mã đơn: ORD-${String(i + 1).padStart(6, '0')}`
            : i % 3 === 1
                ? 'Đơn đặt vé đã bị hủy do hết thời gian thanh toán.'
                : 'Vé của bạn đã được hoàn tiền thành công.',
    }));
    await prisma.notification.createMany({
        data: [...partnerNotifs, ...userNotifs].map((n) => ({
            id: uid(),
            ...n,
            isRead: Math.random() > 0.5,
            readAt: Math.random() > 0.7 ? daysAgo(r(1, 5)) : null,
        })),
    });
    // ── 17. Partner Staff ─────────────────────────────────────────────────────────
    console.log('👷 Tạo 5 partner staff...');
    await prisma.partnerStaff.createMany({
        data: [
            { id: uid(), partnerId: partnerIds[0], userId: regularUserIds[20], role: client_1.StaffRole.MANAGER },
            { id: uid(), partnerId: partnerIds[0], userId: regularUserIds[21], role: client_1.StaffRole.CASHIER },
            { id: uid(), partnerId: partnerIds[1], userId: regularUserIds[22], role: client_1.StaffRole.SCANNER },
            { id: uid(), partnerId: partnerIds[2], userId: regularUserIds[23], role: client_1.StaffRole.STAFF },
            { id: uid(), partnerId: partnerIds[3], userId: regularUserIds[24], role: client_1.StaffRole.MANAGER },
        ],
        skipDuplicates: true,
    });
    // ── Summary ───────────────────────────────────────────────────────────────────
    const counts = await Promise.all([
        prisma.user.count(),
        prisma.partner.count(),
        prisma.movie.count(),
        prisma.showtime.count(),
        prisma.seat.count(),
        prisma.order.count(),
        prisma.ticket.count(),
        prisma.review.count(),
        prisma.transaction.count(),
        prisma.notification.count(),
    ]);
    console.log('\n✅ Seed hoàn thành!');
    console.log('──────────────────────────────');
    console.log(`👤 Users:         ${counts[0]}`);
    console.log(`🏢 Partners:      ${counts[1]}`);
    console.log(`🎬 Movies:        ${counts[2]}`);
    console.log(`🎟 Showtimes:     ${counts[3]}`);
    console.log(`💺 Seats:         ${counts[4]}`);
    console.log(`📦 Orders:        ${counts[5]}`);
    console.log(`🎫 Tickets:       ${counts[6]}`);
    console.log(`⭐ Reviews:       ${counts[7]}`);
    console.log(`💰 Transactions:  ${counts[8]}`);
    console.log(`🔔 Notifications: ${counts[9]}`);
    console.log('──────────────────────────────');
    console.log('\n🔑 Tài khoản test:');
    console.log(`   Admin:   admin@${DOMAIN}  / Cinepass@2025`);
    console.log(`   Partner: partner1@${DOMAIN} / Cinepass@2025`);
    console.log(`   User:    user1@${DOMAIN}    / Cinepass@2025`);
}
main()
    .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
