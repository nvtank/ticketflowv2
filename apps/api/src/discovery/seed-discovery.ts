import type { Prisma } from '../generated/prisma/client';

/** Fictional, labelled local demo content. Never invent customer reviews. */
export async function seedDiscovery(db: Prisma.TransactionClient) {
  const profiles = [
    {
      slug: 'luma',
      name: 'Luma',
      genre: 'Electronic',
      color: 'violet',
      tagline: 'Chạm đến cảm xúc qua từng lớp âm thanh.',
      biography:
        'Luma là hồ sơ nghệ sĩ hư cấu dành cho bản demo TixFlow. Phong cách được mô tả là electronic pha ambient: giai điệu nhẹ nhàng mở đầu, nhịp điệu dần mở rộng và một không gian âm thanh giàu màu sắc.\n\nHồ sơ này giúp bạn khám phá mối liên kết giữa nghệ sĩ và lịch sự kiện trước khi chọn vé.',
    },
    {
      slug: 'may-acoustic',
      name: 'Mây Acoustic',
      genre: 'Acoustic',
      color: 'amber',
      tagline: 'Một chút dịu dàng giữa những ngày vội vã.',
      biography:
        'Mây Acoustic là nhóm nhạc hư cấu trong dữ liệu demo. Không gian biểu diễn được lấy cảm hứng từ guitar mộc, giọng hát gần gũi và những câu chuyện nhỏ được kể bằng âm nhạc.\n\nTên và câu chuyện chỉ phục vụ trải nghiệm phát triển, không đại diện cho nghệ sĩ hay lịch diễn có thật.',
    },
    {
      slug: 'midnight-lines',
      name: 'Midnight Lines',
      genre: 'Indie',
      color: 'rose',
      tagline: 'Những câu chuyện còn ngân sau nửa đêm.',
      biography:
        'Midnight Lines là ban nhạc indie hư cấu dùng trong bản local. Guitar, synth và trống gặp nhau trong một phong cách giàu tính tự sự, lấy cảm hứng từ thành phố về đêm.\n\nKhám phá sự kiện được liên kết bên dưới để trải nghiệm hành trình từ hồ sơ nghệ sĩ đến sơ đồ ghế.',
    },
    {
      slug: 'song',
      name: 'Sóng',
      genre: 'Alternative',
      color: 'cyan',
      tagline: 'Tự do trong từng nhịp chuyển động.',
      biography:
        'Sóng là dự án âm nhạc hư cấu dành cho TixFlow demo. Phong cách alternative kết hợp những nhịp điệu linh hoạt và âm thanh điện tử, tạo cảm hứng cho không gian lễ hội.\n\nHồ sơ minh họa khả năng giới thiệu nghệ sĩ và kết nối những trải nghiệm cùng phong cách.',
    },
    {
      slug: 'vung-troi',
      name: 'Vùng Trời',
      genre: 'Pop',
      color: 'violet',
      tagline: 'Bay cao cùng những giai điệu rộng mở.',
      biography:
        'Vùng Trời là nghệ danh hư cấu trong bộ dữ liệu demo TixFlow. Phong cách pop hiện đại được mô tả với điệp khúc rộng, lớp bè dày và năng lượng sân khấu hướng về khán giả.\n\nHồ sơ chỉ phục vụ trải nghiệm phát triển và kiểm thử, không đại diện cho nghệ sĩ có thật.',
    },
    {
      slug: 'ban-mai',
      name: 'Ban Mai',
      genre: 'Ballad',
      color: 'amber',
      tagline: 'Khoảng lặng ấm áp cho một ngày mới.',
      biography:
        'Ban Mai là giọng ca ballad hư cấu dành cho bản demo. Chất liệu âm nhạc xoay quanh piano, dàn dây nhẹ và những câu chuyện về sự khởi đầu.\n\nTên gọi và tiểu sử chỉ nhằm minh họa trang hồ sơ nghệ sĩ trong môi trường phát triển.',
    },
    {
      slug: 'ha-dong-band',
      name: 'Hà Đông Band',
      genre: 'Rock',
      color: 'rose',
      tagline: 'Năng lượng mộc mạc từ những khu phố cũ.',
      biography:
        'Hà Đông Band là ban nhạc rock hư cấu trong dữ liệu demo TixFlow. Âm thanh guitar đậm, trống dồn và tinh thần biểu diễn trực tiếp là hình dung chính của hồ sơ này.\n\nMọi chi tiết đều là hư cấu phục vụ kiểm thử, không liên quan tới ban nhạc có thật nào.',
    },
    {
      slug: 'tia-nang',
      name: 'Tia Nắng',
      genre: 'Dance',
      color: 'cyan',
      tagline: 'Vũ điệu rực rỡ giữa mùa lễ hội.',
      biography:
        'Tia Nắng là dự án dance-pop hư cấu dành cho bản demo. Nhịp điệu nhanh, synth sáng màu và vũ đạo đồng đều tạo nên hình ảnh sân khấu lễ hội.\n\nHồ sơ giúp kiểm thử trang tuyến nghệ sĩ – sự kiện với nhiều thể loại khác nhau.',
    },
    {
      slug: 'khoi-xanh',
      name: 'Khói Xanh',
      genre: 'Lo-fi',
      color: 'violet',
      tagline: 'Chậm lại một chút giữa thành phố vội vã.',
      biography:
        'Khói Xanh là nghệ danh lo-fi hư cấu trong bộ dữ liệu demo. Không gian âm nhạc được mô tả bằng nhịp chậm, tiếng mưa và những vòng lặp dịu.\n\nToàn bộ nội dung là hư cấu, phục vụ phát triển giao diện khám phá nghệ sĩ.',
    },
    {
      slug: 'giai-dieu-pho',
      name: 'Giai Điệu Phố',
      genre: 'Folk',
      color: 'amber',
      tagline: 'Những câu chuyện phố phường kể bằng guitar mộc.',
      biography:
        'Giai Điệu Phố là nhóm folk hư cấu dành cho demo TixFlow. Guitar mộc, kèn harmonica và lời kể gần gũi là chất liệu chính của hồ sơ.\n\nHồ sơ minh họa cách một nhóm nhạc gắn với nhiều sự kiện trong mục khám phá.',
    },
  ];
  // Only attach fictional artists to the published events owned by the demo seed.
  const events = await db.event.findMany({
    where: {
      id: {
        in: [201, 203, 204, 205, 206].map(
          (value) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`,
        ),
      },
      category: 'MUSIC',
      status: 'PUBLISHED',
    },
    select: { id: true, slug: true },
    orderBy: { slug: 'asc' },
  });
  for (const [index, profile] of profiles.entries()) {
    const artist = await db.artist.upsert({
      where: { slug: profile.slug },
      update: {},
      create: { ...profile, isDemo: true, isPublished: true },
    });
    // Fresh databases must retain the same original artist/event journeys as
    // databases upgraded from the smaller seed, where upsert preserves these links.
    const lineup = events.filter(
      (event, eventIndex) =>
        (index < 4 &&
          ['tixflow-music-festival', 'summer-live-concert'].includes(event.slug)) ||
        eventIndex === index % events.length ||
        eventIndex === (index + 1) % events.length,
    );
    for (const event of lineup)
      await db.eventArtist.upsert({
        where: { eventId_artistId: { eventId: event.id, artistId: artist.id } },
        update: {},
        create: { eventId: event.id, artistId: artist.id },
      });
  }
}
