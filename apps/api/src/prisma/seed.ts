// ============================================================
// OneFlesh — Database Seed
// Reformed Church Matrimonial Platform
// ============================================================

import {
  PrismaClient,
  UserRole,
  ChurchStatus,
  ProfileStatus,
  SeekingType,
  VendorCategory,
  AllianceStatus,
  SessionStatus,
  SessionFormat,
  NotificationType,
  VendorStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding OneFlesh database...');

  // ─── 1. Super Admin User ────────────────────────────────────
  console.log('  Creating super admin...');
  const passwordHash = await bcrypt.hash('Admin@OneFlesh2025!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@oneflesh.in' },
    update: {},
    create: {
      email: 'admin@oneflesh.in',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      mfaEnabled: false,
      passwordChangedAt: new Date(),
    },
  });

  // ─── 2. Churches ────────────────────────────────────────────
  console.log('  Creating churches...');

  const graceHyd = await prisma.church.upsert({
    where: { pastorEmail: 'thomas.abraham@gracereformed.in' },
    update: {},
    create: {
      name: 'Grace Reformed Church',
      denomination: 'Reformed Evangelical',
      city: 'Hyderabad',
      state: 'Andhra Pradesh',
      pastorName: 'Pastor Thomas Abraham',
      pastorEmail: 'thomas.abraham@gracereformed.in',
      pastorPhone: '+91-9440001001',
      congregationSize: 120,
      yearEstablished: 2005,
      doctrinalFlags: {
        affirmsScriptureAlone: true,
        affirmsChristAlone: true,
        affirmsFaithAlone: true,
        affirmsGraceAlone: true,
      },
      status: ChurchStatus.APPROVED,
    },
  });

  const calvaryChennai = await prisma.church.upsert({
    where: { pastorEmail: 'james.philip@calvaryreformed.in' },
    update: {},
    create: {
      name: 'Calvary Reformed Fellowship',
      denomination: 'Calvary Reformed',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pastorName: 'Pastor James Philip',
      pastorEmail: 'james.philip@calvaryreformed.in',
      pastorPhone: '+91-9840001002',
      congregationSize: 95,
      yearEstablished: 2008,
      doctrinalFlags: {
        affirmsScriptureAlone: true,
        affirmsChristAlone: true,
        affirmsFaithAlone: true,
        affirmsGraceAlone: true,
      },
      status: ChurchStatus.APPROVED,
    },
  });

  const covenantVijayawada = await prisma.church.upsert({
    where: { pastorEmail: 'david.mathew@covenantpres.in' },
    update: {},
    create: {
      name: 'Covenant Presbyterian Church',
      denomination: 'Presbyterian',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      pastorName: 'Pastor David Mathew',
      pastorEmail: 'david.mathew@covenantpres.in',
      pastorPhone: '+91-9866001003',
      congregationSize: 80,
      yearEstablished: 2010,
      doctrinalFlags: {
        affirmsScriptureAlone: true,
        affirmsChristAlone: true,
        affirmsFaithAlone: true,
        affirmsGraceAlone: true,
      },
      status: ChurchStatus.APPROVED,
    },
  });

  const reformedBaptistBangalore = await prisma.church.upsert({
    where: { pastorEmail: 'john.george@reformedbaptist.in' },
    update: {},
    create: {
      name: 'Reformed Baptist Church',
      denomination: 'Reformed Baptist',
      city: 'Bangalore',
      state: 'Karnataka',
      pastorName: 'Pastor John George',
      pastorEmail: 'john.george@reformedbaptist.in',
      pastorPhone: '+91-9880001004',
      congregationSize: 65,
      yearEstablished: 2012,
      doctrinalFlags: {
        affirmsScriptureAlone: true,
        affirmsChristAlone: true,
        affirmsFaithAlone: true,
        affirmsGraceAlone: true,
      },
      status: ChurchStatus.APPROVED,
    },
  });

  const graceKochi = await prisma.church.upsert({
    where: { pastorEmail: 'samuel.varghese@gracereformedkochi.in' },
    update: {},
    create: {
      name: 'Grace Reformed Kochi',
      denomination: 'Reformed Evangelical',
      city: 'Kochi',
      state: 'Kerala',
      pastorName: 'Pastor Samuel Varghese',
      pastorEmail: 'samuel.varghese@gracereformedkochi.in',
      pastorPhone: '+91-9895001005',
      congregationSize: 110,
      yearEstablished: 2007,
      doctrinalFlags: {
        affirmsScriptureAlone: true,
        affirmsChristAlone: true,
        affirmsFaithAlone: true,
        affirmsGraceAlone: true,
      },
      status: ChurchStatus.APPROVED,
    },
  });

  const sovereignGraceMadurai = await prisma.church.upsert({
    where: { pastorEmail: 'paul.kumar@sovereigngrace.in' },
    update: {},
    create: {
      name: 'Sovereign Grace Fellowship',
      denomination: 'Sovereign Grace',
      city: 'Madurai',
      state: 'Tamil Nadu',
      pastorName: 'Pastor Paul Kumar',
      pastorEmail: 'paul.kumar@sovereigngrace.in',
      pastorPhone: '+91-9842001006',
      congregationSize: 55,
      yearEstablished: 2014,
      doctrinalFlags: {
        affirmsScriptureAlone: true,
        affirmsChristAlone: true,
        affirmsFaithAlone: true,
        affirmsGraceAlone: true,
      },
      status: ChurchStatus.APPROVED,
    },
  });

  // ─── 3. Pastor Users (required for Profile.pastorId) ────────
  console.log('  Creating pastor users...');

  const pastorThomas = await prisma.user.upsert({
    where: { email: 'thomas.abraham@gracereformed.in' },
    update: {},
    create: {
      email: 'thomas.abraham@gracereformed.in',
      passwordHash: await bcrypt.hash('Pastor@Grace2025!', 12),
      role: UserRole.PASTOR,
      churchId: graceHyd.id,
    },
  });

  const pastorJames = await prisma.user.upsert({
    where: { email: 'james.philip@calvaryreformed.in' },
    update: {},
    create: {
      email: 'james.philip@calvaryreformed.in',
      passwordHash: await bcrypt.hash('Pastor@Calvary2025!', 12),
      role: UserRole.PASTOR,
      churchId: calvaryChennai.id,
    },
  });

  const pastorDavid = await prisma.user.upsert({
    where: { email: 'david.mathew@covenantpres.in' },
    update: {},
    create: {
      email: 'david.mathew@covenantpres.in',
      passwordHash: await bcrypt.hash('Pastor@Covenant2025!', 12),
      role: UserRole.PASTOR,
      churchId: covenantVijayawada.id,
    },
  });

  const pastorJohn = await prisma.user.upsert({
    where: { email: 'john.george@reformedbaptist.in' },
    update: {},
    create: {
      email: 'john.george@reformedbaptist.in',
      passwordHash: await bcrypt.hash('Pastor@Baptist2025!', 12),
      role: UserRole.PASTOR,
      churchId: reformedBaptistBangalore.id,
    },
  });

  const pastorSamuel = await prisma.user.upsert({
    where: { email: 'samuel.varghese@gracereformedkochi.in' },
    update: {},
    create: {
      email: 'samuel.varghese@gracereformedkochi.in',
      passwordHash: await bcrypt.hash('Pastor@Kochi2025!', 12),
      role: UserRole.PASTOR,
      churchId: graceKochi.id,
    },
  });

  const pastorPaul = await prisma.user.upsert({
    where: { email: 'paul.kumar@sovereigngrace.in' },
    update: {},
    create: {
      email: 'paul.kumar@sovereigngrace.in',
      passwordHash: await bcrypt.hash('Pastor@Sovereign2025!', 12),
      role: UserRole.PASTOR,
      churchId: sovereignGraceMadurai.id,
    },
  });

  // ─── 4. Profiles ─────────────────────────────────────────────
  console.log('  Creating profiles...');

  // Profile 1: Samuel Raju — 26, Hyderabad, AP, Grace Reformed, Software Engineer, BRIDE, 8 yrs, 4 endorsements
  const samuelRaju = await prisma.profile.upsert({
    where: { id: 'profile-samuel-raju-001' },
    update: {},
    create: {
      id: 'profile-samuel-raju-001',
      churchId: graceHyd.id,
      pastorId: pastorThomas.id,
      fullName: 'Samuel Raju',
      age: 26,
      city: 'Hyderabad',
      state: 'Andhra Pradesh',
      education: "B.Tech, Computer Science — JNTU Hyderabad",
      occupation: 'Software Engineer',
      seeking: SeekingType.BRIDE,
      testimony:
        "I came to saving faith in the Lord Jesus Christ at the age of seventeen, when the Holy Spirit opened my eyes to the glory of the gospel through the preaching of Romans 8 at Grace Reformed Church. Since then, God's sovereign grace has been the anchor of my soul. I serve as a worship team member and Sunday school teacher, and I long to lead a home that honours the Triune God in every aspect of family life.",
      ministryInvolvement: 'Worship team, Sunday school teacher, youth discipleship',
      pastorRecommendation:
        'Samuel is a young man of proven godly character, sincere Reformed conviction, and quiet servant leadership. He is warmly commended for this platform.',
      endorsements: [
        {
          name: 'Elder Ravi Prasad',
          relationship: 'Church Elder',
          text: 'Samuel has served faithfully in the congregation for years. He is humble, diligent in the Word, and genuinely seeks God\'s glory above his own comfort.',
        },
        {
          name: 'Deacon Philip Thomas',
          relationship: 'Deacon',
          text: 'A trustworthy brother who handles responsibility with grace and wisdom beyond his years.',
        },
        {
          name: 'Mrs. Leela Abraham',
          relationship: 'Sunday School Coordinator',
          text: 'Samuel\'s devotion to the children\'s ministry reflects a heart shaped by the gospel. He would make an excellent husband and father.',
        },
        {
          name: 'Mr. Solomon Raju',
          relationship: 'Father',
          text: 'We have raised Samuel in the nurture and admonition of the Lord. He has been a joy to our family and a consistent witness in his community.',
        },
      ],
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      yearsInChurch: 8,
      status: ProfileStatus.APPROVED,
    },
  });

  // Profile 2: Priya Joseph — 24, Chennai, TN, Calvary Reformed, Healthcare/Nurse, GROOM, 10 yrs, 5 endorsements
  const priyaJoseph = await prisma.profile.upsert({
    where: { id: 'profile-priya-joseph-002' },
    update: {},
    create: {
      id: 'profile-priya-joseph-002',
      churchId: calvaryChennai.id,
      pastorId: pastorJames.id,
      fullName: 'Priya Joseph',
      age: 24,
      city: 'Chennai',
      state: 'Tamil Nadu',
      education: 'B.Sc Nursing — Madras Medical College',
      occupation: 'Healthcare Worker / Nurse',
      seeking: SeekingType.GROOM,
      testimony:
        "The Lord drew me to Himself through the patient witness of my grandmother and the Spirit-filled preaching at Calvary Reformed Fellowship. I received the grace of God in my early teens and have been growing in that grace ever since. I serve in the women's ministry and hospital outreach team, and my deepest desire is to build a covenant home where Christ is exalted as Lord over every room and every relationship.",
      ministryInvolvement: "Women's Bible study leader, hospital outreach, choir",
      pastorRecommendation:
        'Sister Priya is a godly, mature, and doctrinally sound young woman. Her love for Christ is evident in her daily life and her ministry. She is unreservedly recommended.',
      endorsements: [
        {
          name: 'Elder Samuel Philip',
          relationship: 'Church Elder',
          text: 'Priya embodies the Proverbs 31 woman — diligent, compassionate, and deeply rooted in the Word of God.',
        },
        {
          name: 'Dr. Mary Cherian',
          relationship: 'Senior Nurse Mentor',
          text: 'Priya brings the same dedication and integrity to her nursing as she does to her faith. She is a remarkable young woman.',
        },
        {
          name: 'Mrs. Susan Thomas',
          relationship: "Women's Ministry Leader",
          text: 'She leads our women\'s study with remarkable clarity and grace. Her love for Reformed doctrine is matched only by her love for people.',
        },
        {
          name: 'Mr. Joseph Chacko',
          relationship: 'Father',
          text: 'We entrust our daughter to the Lord\'s leading through this platform. She has been a tremendous blessing to our family and to the church.',
        },
        {
          name: 'Mrs. Annamma Joseph',
          relationship: 'Mother',
          text: 'Priya has walked with the Lord faithfully from her childhood. We pray He brings a godly man to lead their home for His glory.',
        },
      ],
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
      yearsInChurch: 10,
      status: ProfileStatus.APPROVED,
    },
  });

  // Profile 3: David Mathew — 29, Vijayawada, AP, Covenant Presbyterian, Business Manager, BRIDE, 12 yrs, 3 endorsements
  const davidMathew = await prisma.profile.upsert({
    where: { id: 'profile-david-mathew-003' },
    update: {},
    create: {
      id: 'profile-david-mathew-003',
      churchId: covenantVijayawada.id,
      pastorId: pastorDavid.id,
      fullName: 'David Mathew',
      age: 29,
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      education: 'MBA — Andhra University',
      occupation: 'Business Manager',
      seeking: SeekingType.BRIDE,
      testimony:
        "God in His sovereign mercy saved me through the reading of the Westminster Shorter Catechism at age seventeen. The doctrines of grace have since become the bedrock of my understanding of God and man. For twelve years I have served at Covenant Presbyterian Church in various capacities — as a deacon, as a life group leader, and now as a men's ministry coordinator. I seek a wife who fears the Lord above all things and who desires to build a home that is a little outpost of the kingdom of God.",
      ministryInvolvement: "Deacon, men's ministry coordinator, life group leader",
      pastorRecommendation:
        'David is one of the finest young men in our congregation — spiritually mature, theologically grounded, and utterly reliable. He is commended without reservation.',
      endorsements: [
        {
          name: 'Rev. George Kuriakose',
          relationship: 'Associate Pastor',
          text: 'David\'s decade-long service to this congregation speaks for itself. He is a man of integrity and genuine Reformed conviction.',
        },
        {
          name: 'Elder Jacob Thomas',
          relationship: 'Church Elder',
          text: 'I have mentored David for several years. He has a shepherd\'s heart and a leader\'s discipline. He will lead a home well.',
        },
        {
          name: 'Mr. Mathew Varghese',
          relationship: 'Father',
          text: 'We raise our son before the Lord. He has honoured God and our family. We commend him to the wisdom of this platform.',
        },
      ],
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
      yearsInChurch: 12,
      status: ProfileStatus.APPROVED,
    },
  });

  // Profile 4: Ruth Thomas — 22, Bangalore, KA, Reformed Baptist, School Teacher, GROOM, 7 yrs, 4 endorsements
  await prisma.profile.upsert({
    where: { id: 'profile-ruth-thomas-004' },
    update: {},
    create: {
      id: 'profile-ruth-thomas-004',
      churchId: reformedBaptistBangalore.id,
      pastorId: pastorJohn.id,
      fullName: 'Ruth Thomas',
      age: 22,
      city: 'Bangalore',
      state: 'Karnataka',
      education: 'B.Ed — Bangalore University',
      occupation: 'School Teacher',
      seeking: SeekingType.GROOM,
      testimony:
        "The grace of God arrested me at fifteen when I heard the gospel plainly preached at a reformed youth conference. The truth of God's unconditional election undid all my self-righteousness and replaced it with a joyful dependence on Christ alone. I have served in the children's ministry and Sunday school at Reformed Baptist Church for seven years. I long to be a helpmeet to a man who walks in the fear of God, and together raise children in the covenant of grace.",
      ministryInvolvement: "Children's ministry, Sunday school teacher, hospitality team",
      pastorRecommendation:
        'Ruth is a bright, godly, and doctrinally sound sister. Her care for the children in our congregation is exemplary. She is warmly commended.',
      endorsements: [
        {
          name: 'Elder Suresh Nair',
          relationship: 'Church Elder',
          text: 'Ruth serves with a cheerful heart and a clear gospel understanding. She will be a wonderful wife and mother.',
        },
        {
          name: 'Mrs. Grace Philip',
          relationship: "Women's Ministry Coordinator",
          text: 'A joy to mentor. Ruth is humble, teachable, and deeply committed to the Lord\'s purposes for her life.',
        },
        {
          name: 'Mr. Thomas Cherian',
          relationship: 'Father',
          text: 'Ruth has been raised in the discipline and instruction of the Lord. We commit her to His sovereign care through this platform.',
        },
        {
          name: 'Mrs. Lily Thomas',
          relationship: 'Mother',
          text: 'Our daughter\'s faith is her own and it is genuine. She seeks a man who will lead her closer to Christ, and we pray this platform is God\'s means.',
        },
      ],
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      yearsInChurch: 7,
      status: ProfileStatus.APPROVED,
    },
  });

  // Profile 5: Joel Philip — 27, Kochi, KL, Grace Reformed Kochi, Medical Doctor, BRIDE, 9 yrs, 5 endorsements
  await prisma.profile.upsert({
    where: { id: 'profile-joel-philip-005' },
    update: {},
    create: {
      id: 'profile-joel-philip-005',
      churchId: graceKochi.id,
      pastorId: pastorSamuel.id,
      fullName: 'Joel Philip',
      age: 27,
      city: 'Kochi',
      state: 'Kerala',
      education: 'MBBS, MD Internal Medicine — Government Medical College Kochi',
      occupation: 'Medical Doctor',
      seeking: SeekingType.BRIDE,
      testimony:
        "God saved me during my first year of medical college when the futility of trusting in human knowledge became apparent in the face of suffering and death. A visiting Reformed preacher from Kochi came to our hostel Bible study and the doctrines of grace transformed my understanding of salvation. I have since been an active member of Grace Reformed Kochi, serving in the medical outreach ministry and leading a men's discipleship group. I seek a wife who is first a woman of the Word, and who sees her gifts as instruments for God's glory.",
      ministryInvolvement: 'Medical outreach, men\'s discipleship, church health committee',
      pastorRecommendation:
        'Joel is an outstanding young man — scholarly, spiritually disciplined, and genuinely humble. His service in medical outreach reflects a pastor\'s heart. Unreservedly commended.',
      endorsements: [
        {
          name: 'Elder Abraham Jacob',
          relationship: 'Church Elder',
          text: 'Joel combines professional excellence with deep spiritual maturity. He is exactly the kind of man we pray our daughters will find.',
        },
        {
          name: 'Dr. Rajan Philip',
          relationship: 'Senior Physician and Deacon',
          text: 'As his mentor in both medicine and faith, I commend Joel unreservedly. He handles both with great integrity.',
        },
        {
          name: 'Deacon Thomas Varkey',
          relationship: 'Deacon',
          text: 'Joel\'s consistency in both public worship and private devotion is an encouragement to the entire congregation.',
        },
        {
          name: 'Mr. Philip George',
          relationship: 'Father',
          text: 'Joel has always sought God\'s will over his own. We trust this platform as a means of God\'s providence in his life.',
        },
        {
          name: 'Mrs. Mary Philip',
          relationship: 'Mother',
          text: 'A mother cannot ask for more than a son who loves God with his whole heart. Joel has been that son, and we commend him to the Lord\'s leading.',
        },
      ],
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&q=80',
      yearsInChurch: 9,
      status: ProfileStatus.APPROVED,
    },
  });

  // Profile 6: Esther Kumar — 25, Madurai, TN, Sovereign Grace, Software Developer, GROOM, 6 yrs, 3 endorsements
  const estherKumar = await prisma.profile.upsert({
    where: { id: 'profile-esther-kumar-006' },
    update: {},
    create: {
      id: 'profile-esther-kumar-006',
      churchId: sovereignGraceMadurai.id,
      pastorId: pastorPaul.id,
      fullName: 'Esther Kumar',
      age: 25,
      city: 'Madurai',
      state: 'Tamil Nadu',
      education: 'B.E. Computer Science — Anna University',
      occupation: 'Software Developer',
      seeking: SeekingType.GROOM,
      testimony:
        "I was raised in a nominally Christian home but came to genuine saving faith at nineteen when a friend took me to Sovereign Grace Fellowship and I heard the doctrines of grace preached with clarity and power. The sovereignty of God in salvation broke through every pretence of self-sufficiency. Since then I have served in the media and communications ministry of our church, using my technical skills for the Kingdom. I desire to be united to a man who is unashamed of the Reformed faith and who leads with sacrificial love after the pattern of Christ.",
      ministryInvolvement: 'Church media and communications, women\'s Bible study participant, event coordination',
      pastorRecommendation:
        'Esther is a gifted, grounded, and genuinely gospel-centred young woman. Her contribution to our ministry is invaluable. She is commended with great confidence.',
      endorsements: [
        {
          name: 'Elder Vijay Raj',
          relationship: 'Church Elder',
          text: 'Esther\'s transformation from nominal faith to robust Reformed conviction has been a testimony to the whole congregation.',
        },
        {
          name: 'Mrs. Prem Latha',
          relationship: "Women's Ministry Leader",
          text: 'Esther brings both competence and Christ-centredness to everything she does. She will be an exceptional wife to a godly man.',
        },
        {
          name: 'Mr. Kumar Samuel',
          relationship: 'Father',
          text: 'We have watched Esther grow into a woman of God and it has been our greatest joy. We commend her to the Lord\'s providential guidance.',
        },
      ],
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80',
      yearsInChurch: 6,
      status: ProfileStatus.APPROVED,
    },
  });

  // ─── 5. Vendors ───────────────────────────────────────────────
  console.log('  Creating vendors...');

  await prisma.vendor.upsert({
    where: { id: 'vendor-grace-bridal-001' },
    update: {},
    create: {
      id: 'vendor-grace-bridal-001',
      churchId: graceHyd.id,
      businessName: 'Grace Bridal Studio',
      category: VendorCategory.TAILORS,
      location: 'Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      state: 'Andhra Pradesh',
      description:
        'Specialising in elegant Christian bridal wear and groom suits crafted with the highest quality fabrics. We understand the sanctity of the occasion and ensure every garment honours the solemnity and joy of a covenant wedding.',
      priceFrom: '8000',
      priceType: 'per outfit',
      photoUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e03?w=400&auto=format&q=75',
      ownerName: 'Mary Philip',
      phone: '+91-9440002001',
      email: 'mary@gracebridalstudio.in',
      verified: true,
      featured: true,
      status: VendorStatus.APPROVED,
    },
  });

  await prisma.vendor.upsert({
    where: { id: 'vendor-heavenly-bakes-002' },
    update: {},
    create: {
      id: 'vendor-heavenly-bakes-002',
      churchId: calvaryChennai.id,
      businessName: 'Heavenly Bakes by Sarah',
      category: VendorCategory.CAKES,
      location: 'T. Nagar, Chennai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      description:
        'Custom tiered wedding cakes and celebration pastries crafted with love and prayer. Each cake is baked fresh and decorated to reflect the couple\'s covenant story. We also offer cake-tasting consultations for church couples.',
      priceFrom: '4500',
      priceType: 'starting price',
      photoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&q=75',
      ownerName: 'Sarah John',
      phone: '+91-9840002002',
      email: 'sarah@heavenlybakes.in',
      verified: true,
      featured: false,
      status: VendorStatus.APPROVED,
    },
  });

  await prisma.vendor.upsert({
    where: { id: 'vendor-covenant-frames-003' },
    update: {},
    create: {
      id: 'vendor-covenant-frames-003',
      churchId: covenantVijayawada.id,
      businessName: 'Covenant Frames Photography',
      category: VendorCategory.PHOTOGRAPHY,
      location: 'MG Road, Vijayawada',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      description:
        'Capturing the sacred moments of Reformed church weddings with artistry and reverence. Full-day photography and videography packages available. Specialising in candid, documentary-style coverage that tells the story of God\'s providence in your union.',
      priceFrom: '25000',
      priceType: 'full package',
      photoUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&auto=format&q=75',
      ownerName: 'David James',
      phone: '+91-9866002003',
      email: 'david@covenantframes.in',
      verified: true,
      featured: true,
      status: VendorStatus.APPROVED,
    },
  });

  await prisma.vendor.upsert({
    where: { id: 'vendor-philips-feast-004' },
    update: {},
    create: {
      id: 'vendor-philips-feast-004',
      churchId: graceKochi.id,
      businessName: "Philip's Feast Catering",
      category: VendorCategory.CATERING,
      location: 'Edapally, Kochi',
      city: 'Kochi',
      state: 'Kerala',
      description:
        'Full-service Christian wedding catering with Kerala, South Indian, and North Indian cuisine. We cater with joy to the covenant feast of your marriage, ensuring every guest at your table is blessed. Minimum 100 guests.',
      priceFrom: '350',
      priceType: 'per plate',
      photoUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&auto=format&q=75',
      ownerName: 'Philip Jacob',
      phone: '+91-9895002004',
      email: 'philip@philipsfeast.in',
      verified: true,
      featured: false,
      status: VendorStatus.APPROVED,
    },
  });

  await prisma.vendor.upsert({
    where: { id: 'vendor-blessed-wheels-005' },
    update: {},
    create: {
      id: 'vendor-blessed-wheels-005',
      churchId: reformedBaptistBangalore.id,
      businessName: 'Blessed Wheels Car Rentals',
      category: VendorCategory.CARS,
      location: 'Koramangala, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      description:
        'Premium wedding car rentals for the bridal party, family, and out-of-town guests. Fleet includes decorated sedans, SUVs, and luxury vehicles. Christian-owned and operated with a commitment to punctuality and care.',
      priceFrom: '3500',
      priceType: 'per day',
      photoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&auto=format&q=75',
      ownerName: 'George Mathew',
      phone: '+91-9880002005',
      email: 'george@blessedwheels.in',
      verified: true,
      featured: false,
      status: VendorStatus.APPROVED,
    },
  });

  await prisma.vendor.upsert({
    where: { id: 'vendor-eden-flowers-006' },
    update: {},
    create: {
      id: 'vendor-eden-flowers-006',
      churchId: sovereignGraceMadurai.id,
      businessName: 'Eden Flowers & Stage Decor',
      category: VendorCategory.DECOR,
      location: 'Anna Nagar, Madurai',
      city: 'Madurai',
      state: 'Tamil Nadu',
      description:
        'Beautiful floral arrangements and stage decorations that transform church halls into covenant celebration spaces. We specialise in modest, elegant décor that reflects the beauty of the Lord and the joy of the occasion without ostentation.',
      priceFrom: '18000',
      priceType: 'full stage decoration',
      photoUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc4e?w=400&auto=format&q=75',
      ownerName: 'Leela Thomas',
      phone: '+91-9842002006',
      email: 'leela@edenflowers.in',
      verified: true,
      featured: true,
      status: VendorStatus.APPROVED,
    },
  });

  await prisma.vendor.upsert({
    where: { id: 'vendor-zion-valley-007' },
    update: {},
    create: {
      id: 'vendor-zion-valley-007',
      churchId: graceKochi.id,
      businessName: 'Zion Valley Resorts',
      category: VendorCategory.VENUES,
      location: 'Munnar Hills, Kerala',
      city: 'Munnar',
      state: 'Kerala',
      description:
        'A breathtaking hill resort nestled in the tea estates of Munnar — ideal for wedding receptions, family retreats, and honeymoon stays. Our covenant package includes exclusive use of the resort grounds, chapel access, catering, and accommodation for up to 80 guests.',
      priceFrom: '120000',
      priceType: 'full package',
      photoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&q=75',
      ownerName: 'Abraham Varghese',
      phone: '+91-9895002007',
      email: 'abraham@zionvalleyresorts.in',
      website: 'https://www.zionvalleyresorts.in',
      verified: true,
      featured: true,
      status: VendorStatus.APPROVED,
    },
  });

  // ─── 6. Alliances ─────────────────────────────────────────────
  console.log('  Creating alliances...');

  // Alliance 1: Samuel Raju + Priya Joseph, stage 2, opened 20 May 2025
  const alliance1 = await prisma.alliance.upsert({
    where: { id: 'alliance-samuel-priya-001' },
    update: {},
    create: {
      id: 'alliance-samuel-priya-001',
      profile1Id: samuelRaju.id,
      profile2Id: priyaJoseph.id,
      church1Id: graceHyd.id,
      church2Id: calvaryChennai.id,
      stage: 2,
      status: AllianceStatus.ACTIVE,
      openedAt: new Date('2025-05-20T10:00:00Z'),
    },
  });

  // Alliance 2: David Mathew + Esther Kumar, stage 3, opened 8 May 2025
  const alliance2 = await prisma.alliance.upsert({
    where: { id: 'alliance-david-esther-002' },
    update: {},
    create: {
      id: 'alliance-david-esther-002',
      profile1Id: davidMathew.id,
      profile2Id: estherKumar.id,
      church1Id: covenantVijayawada.id,
      church2Id: sovereignGraceMadurai.id,
      stage: 3,
      status: AllianceStatus.ACTIVE,
      openedAt: new Date('2025-05-08T09:00:00Z'),
    },
  });

  // ─── 7. Alliance Notes ────────────────────────────────────────
  console.log('  Creating alliance notes...');

  await prisma.allianceNote.upsert({
    where: { id: 'note-alliance1-001' },
    update: {},
    create: {
      id: 'note-alliance1-001',
      allianceId: alliance1.id,
      authorId: adminUser.id,
      content:
        'Both families have been informed of the alliance. Initial interest confirmed by pastors on both sides. Proceeding to evaluation stage.',
    },
  });

  await prisma.allianceNote.upsert({
    where: { id: 'note-alliance2-001' },
    update: {},
    create: {
      id: 'note-alliance2-001',
      allianceId: alliance2.id,
      authorId: adminUser.id,
      content:
        'Families introduced over video call on 18 May 2025. Both sets of parents expressed positive response. Alliance is progressing well. Awaiting family visits to be scheduled.',
    },
  });

  await prisma.allianceNote.upsert({
    where: { id: 'note-alliance2-002' },
    update: {},
    create: {
      id: 'note-alliance2-002',
      allianceId: alliance2.id,
      authorId: adminUser.id,
      content:
        'David\'s family will travel to Madurai on 7 June 2025 to meet Esther\'s family in person. Pastor Paul Kumar and Pastor David Mathew will both be present to provide pastoral oversight.',
    },
  });

  // ─── 8. Counselling Sessions for Alliance 2 ──────────────────
  console.log('  Creating counselling sessions...');

  await prisma.counsellingSession.upsert({
    where: { id: 'session-alliance2-001' },
    update: {},
    create: {
      id: 'session-alliance2-001',
      allianceId: alliance2.id,
      groomName: 'David Mathew',
      brideName: 'Esther Kumar',
      groomChurch: 'Covenant Presbyterian Church',
      brideChurch: 'Sovereign Grace Fellowship',
      counsellorName: 'Pastor David Mathew',
      sessionNumber: 1,
      sessionDate: new Date('2025-05-15T10:00:00Z'),
      format: SessionFormat.IN_PERSON,
      status: SessionStatus.COMPLETED,
      completedAt: new Date('2025-05-15T11:35:00Z'),
      notes:
        'Session 1 — The Covenant Design. Both David and Esther engaged thoughtfully with Genesis 2:24 and Ephesians 5:22–33. Healthy discussion on the purpose of marriage as a picture of Christ and the church. No concerns raised.',
    },
  });

  await prisma.counsellingSession.upsert({
    where: { id: 'session-alliance2-002' },
    update: {},
    create: {
      id: 'session-alliance2-002',
      allianceId: alliance2.id,
      groomName: 'David Mathew',
      brideName: 'Esther Kumar',
      groomChurch: 'Covenant Presbyterian Church',
      brideChurch: 'Sovereign Grace Fellowship',
      counsellorName: 'Pastor David Mathew',
      sessionNumber: 2,
      sessionDate: new Date('2025-05-22T10:00:00Z'),
      format: SessionFormat.VIDEO_CALL,
      status: SessionStatus.COMPLETED,
      completedAt: new Date('2025-05-22T11:40:00Z'),
      notes:
        'Session 2 — Roles & Servant Leadership. David articulated a clear and humble understanding of headship as servant leadership after the pattern of Christ. Esther expressed appreciation for this and shared her commitment to a complementarian home. Excellent session.',
    },
  });

  await prisma.counsellingSession.upsert({
    where: { id: 'session-alliance2-003' },
    update: {},
    create: {
      id: 'session-alliance2-003',
      allianceId: alliance2.id,
      groomName: 'David Mathew',
      brideName: 'Esther Kumar',
      groomChurch: 'Covenant Presbyterian Church',
      brideChurch: 'Sovereign Grace Fellowship',
      counsellorName: 'Pastor David Mathew',
      sessionNumber: 3,
      sessionDate: new Date('2025-06-05T10:00:00Z'),
      format: SessionFormat.IN_PERSON,
      status: SessionStatus.SCHEDULED,
      notes: 'Session 3 — Communication & Conflict Resolution. Scheduled for 5 June 2025 in person at Covenant Presbyterian Church.',
    },
  });

  // ─── 9. Notifications for Admin ──────────────────────────────
  console.log('  Creating notifications...');

  await prisma.notification.upsert({
    where: { id: 'notif-admin-001' },
    update: {},
    create: {
      id: 'notif-admin-001',
      userId: adminUser.id,
      type: NotificationType.PROFILE_APPROVED,
      title: 'New Profile Approved',
      body: 'Samuel Raju\'s profile has been approved and is now visible to pastors on the platform.',
      read: true,
      relatedEntityType: 'Profile',
      relatedEntityId: samuelRaju.id,
      createdAt: new Date('2025-05-10T08:00:00Z'),
    },
  });

  await prisma.notification.upsert({
    where: { id: 'notif-admin-002' },
    update: {},
    create: {
      id: 'notif-admin-002',
      userId: adminUser.id,
      type: NotificationType.ALLIANCE_UPDATE,
      title: 'Alliance Opened',
      body: 'A new alliance has been opened between Samuel Raju (Grace Reformed, Hyderabad) and Priya Joseph (Calvary Reformed, Chennai).',
      read: false,
      relatedEntityType: 'Alliance',
      relatedEntityId: alliance1.id,
      createdAt: new Date('2025-05-20T10:05:00Z'),
    },
  });

  await prisma.notification.upsert({
    where: { id: 'notif-admin-003' },
    update: {},
    create: {
      id: 'notif-admin-003',
      userId: adminUser.id,
      type: NotificationType.ALLIANCE_UPDATE,
      title: 'Alliance Advanced to Stage 3',
      body: 'The alliance between David Mathew and Esther Kumar has advanced to Stage 3 — Families Introduced. Both families responded positively.',
      read: false,
      relatedEntityType: 'Alliance',
      relatedEntityId: alliance2.id,
      createdAt: new Date('2025-05-18T14:30:00Z'),
    },
  });

  await prisma.notification.upsert({
    where: { id: 'notif-admin-004' },
    update: {},
    create: {
      id: 'notif-admin-004',
      userId: adminUser.id,
      type: NotificationType.COUNSELLING_REMINDER,
      title: 'Counselling Session Scheduled',
      body: 'Session 3 (Communication & Conflict Resolution) for David Mathew and Esther Kumar is scheduled for 5 June 2025.',
      read: false,
      relatedEntityType: 'CounsellingSession',
      relatedEntityId: 'session-alliance2-003',
      createdAt: new Date('2025-05-29T09:00:00Z'),
    },
  });

  await prisma.notification.upsert({
    where: { id: 'notif-admin-005' },
    update: {},
    create: {
      id: 'notif-admin-005',
      userId: adminUser.id,
      type: NotificationType.SYSTEM,
      title: 'Platform Seeded Successfully',
      body: 'The OneFlesh platform database has been seeded with initial data including churches, profiles, vendors, and alliances. The platform is ready for use.',
      read: false,
      relatedEntityType: null,
      relatedEntityId: null,
      createdAt: new Date('2025-05-29T10:00:00Z'),
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('  Super Admin: admin@oneflesh.in / Admin@OneFlesh2025!');
  console.log(`  Churches created: 6`);
  console.log(`  Profiles created: 6`);
  console.log(`  Vendors created: 7`);
  console.log(`  Alliances created: 2`);
  console.log(`  Counselling sessions: 3`);
  console.log(`  Notifications: 5`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });