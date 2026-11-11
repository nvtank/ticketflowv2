export const repositoryUrl = 'https://github.com/nvtank/ticketflowv2';
export const publicNavigation = [
  { href: '/events', label: 'Khám phá' },
  { href: '/artists', label: 'Nghệ sĩ' },
  { href: '/community', label: 'Cộng đồng' },
  { href: '/about', label: 'Về TixFlow' },
];
export const contributors = [
  {
    handle: 'nvtank',
    initials: 'TA',
    role: 'Project Manager / Scrum Master + CloudOps',
    description: 'Quản lý dự án, điều phối công việc, hạ tầng, CI/CD và vận hành.',
    color: 'violet',
  },
  {
    handle: 'TuanAn0311',
    initials: 'AN',
    role: 'Tech Lead / System Architect + Backend Engineer',
    description: 'Kiến trúc, database, xác thực, booking, thanh toán và kiểm thử backend.',
    color: 'cyan',
  },
  {
    handle: 'nguyen-van-hoan',
    initials: 'VH',
    role: 'Full-stack Developer / Frontend Owner',
    description: 'UI/UX, Next.js, tích hợp API, responsive và kiểm thử E2E.',
    color: 'rose',
  },
] as const;
export const categories = [
  {
    name: 'Âm nhạc',
    value: 'MUSIC',
    number: '01',
    description: 'Để âm nhạc dẫn lối.',
    color: 'violet',
  },
  {
    name: 'Hội nghị',
    value: 'CONFERENCE',
    number: '02',
    description: 'Gặp những góc nhìn mới.',
    color: 'cyan',
  },
  {
    name: 'Workshop',
    value: 'WORKSHOP',
    number: '03',
    description: 'Thử sức. Học hỏi. Kết nối.',
    color: 'rose',
  },
  {
    name: 'Thể thao',
    value: 'SPORTS',
    number: '04',
    description: 'Sống trọn từng nhịp đấu.',
    color: 'amber',
  },
] as const;
