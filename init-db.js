import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, process.env.DB_NAME || 'database.sqlite');

// Instead of deleting the file (which fails if server has it locked),
// we DROP existing tables and recreate them.
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  // Drop existing tables to start fresh
  db.run(`DROP TABLE IF EXISTS admins`);
  db.run(`DROP TABLE IF EXISTS bible_studies`);
  db.run(`DROP TABLE IF EXISTS page_content`);

  // Create bible_studies table
  db.run(`
    CREATE TABLE bible_studies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT NOT NULL
    )
  `);

  // Create page_content table for component-based dynamic text/images
  db.run(`
    CREATE TABLE page_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_name TEXT NOT NULL,
      content_key TEXT NOT NULL,
      content_value TEXT NOT NULL,
      UNIQUE(page_name, content_key)
    )
  `);

  // Create admins table
  db.run(`
    CREATE TABLE admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  // Add default admin (username: admin, password: admin123)
  db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, 
    ['admin', '$2b$10$Vpeyxl6kx2aJYFKCuB2ae.rtdF8MmFLcnWUYOm36iGXn/JHc8Gai2']); 


  // Default data for lists
  const defaultSchedules = [
    { day: 'Sunday School', time: '9:00 AM' },
    { day: 'Morning Worship', time: '10:00 AM' },
    { day: 'Evening Service', time: '6:00 PM' },
    { day: 'Wednesday Prayer & Bible Studies', time: '6:30 PM' }
  ];

  const defaultMessages = [
    { icon: '📖', title: 'First Missionary Journey of Paul', subtext: 'Sunday School Lessons', link: '#' },
    { icon: '✨', title: 'Dispensation of Conscience', subtext: 'Wednesday Bible Studies', link: '#' },
    { icon: '🙏', title: 'Blessed by Forgiveness', subtext: 'Morning Worship Sermon Outline', link: '#' },
    { icon: '🏛️', title: 'Building our Church', subtext: 'Evening Service sermon-outline', link: '#' }
  ];

  const defaultBeliefs1 = `We teach that the Bible is God's written revelation to man, and thus the sixty-six books of the Bible given to us by the Holy Spirit constitute the plenary (inspired equally in all parts) Word of God (1 Corinthians 2:7-14; 2 Peter 1:20-21) that is an objective, propositional revelation (1 Thessalonians 2:13) verbally inspired in every word (2 Timothy 3:16), absolutely inerrant in the original documents, infallible and God-breathed. The only infallible rule of faith and practice (Matthew 5:18; 24:35; John 10:35; 16:12-13; 17:17; 1 Corinthians 2:13; 2 Timothy 3:15-17; Hebrews 4:12; 2 Peter 1:20-21).
Thus we teach the literal, grammatical, historical interpretation of Scripture, which affirms the belief that the opening chapters of Genesis present creation in six literal 24-hour days (Genesis 1:31; Exodus 31:17).
God spoke in His written Word by a process of dual authorship. The Holy Spirit so superintended the human authors that, through their individual personalities and different styles of writing, as sunlight through stained glass windows, they composed and recorded God's Word to man (2 Peter 1:20-21) without error in the whole or in the part (Matthew 5:18; 2 Timothy 3:16).
And lastly, we teach that whereas there may be several applications of any given passage of Scripture, there is but one true interpretation. The meaning of Scripture is to be found as one diligently applies the literal grammatical-historical method of interpretation under the enlightenment of the Holy Spirit (John 7:17; 16:12-15; 1 Corinthians 2:7-15; 1 John 2:20). It is the responsibility of believers as they grow in maturity, to ascertain carefully the true intent and meaning of Scripture, recognizing that such truth is binding on all generations. Yet the truth of Scripture stands in judgment of men; never do men stand in judgment of it.`;

  const defaultBeliefs2 = `We teach that there is but one living and true God (Deuteronomy 6:4; Isaiah 45:5-7; 1 Corinthians 8:4), an infinite, all-knowing Spirit (John 4:24), perfect in all His attributes, one in essence, eternally existing in three Persons--Father, Son, and Holy Spirit (Matthew 28:19; 2 Corinthians 13:14), each equally deserving worship and obedience.

A. God the Father
We teach that God the Father, the first person of the Trinity, orders and disposes all things according to His own purpose and grace (Psalm 145:8,9; 1 Corinthians 8:6). He is the creator of all things (Genesis 1:1-31; Ephesians 3:9). As the only absolute and omnipotent ruler in the universe, He is sovereign in creation, providence, and redemption (Psalm 103:19; Romans 11:36). His fatherhood involves both His designation within the Trinity and His relationship with mankind. As Creator He is Father to all men (Ephesians 4:6), but He is spiritual Father only to believers (Romans 8:14; 2 Corinthians 6:18).
He has decreed for His own glory all things that come to pass (Ephesians 1:11). He continually upholds, directs, and governs all creatures and events (1 Chronicles 29:11).
In His sovereignty He is neither author nor approver of sin (Habakkuk 1:13; John 8:38-47), nor does He abridge the accountability of moral, intelligent creatures (1 Peter 1:17). He has graciously chosen from eternity past those whom He would have as His own (Ephesians 1:4-6); He saves from sin all who come to Him through Jesus Christ; He adopts as his own all those who come to Him; and He becomes, upon adoption, Father to His own (John 1:12; Romans 8:15; Galatians 4:5; Hebrews 12:5-9).

B. God the Son Incarnate
Jesus Christ, the second Person of the Trinity, possesses all the divine excellences, and in these He is coequal, consubstantial, and coeternal with the Father (John 10:30; 14:9).
We teach that God the Father created all things according to His own will, through His Son, Jesus Christ, and in Him all things hold together (John 1:3; Colossians 1:15-17; Hebrews 1:2).
We teach that in the incarnation (God becoming man) Christ surrendered only the prerogatives of deity but nothing of the divine essence, either in degree or kind. In His incarnation, Christ's divine nature united with a human nature in an indissoluble union, and so He became the God-man (Philippians 2:5-8; Colossians 2:9).
We teach that Jesus Christ represents humanity and deity in indivisible oneness (Micah 5:2; John 14:9-10; Colossians 2:9; John 5:23).
We teach that our Lord Jesus Christ was virgin born (Isaiah 7:14; Matthew 1:23, 25; Luke 1:26-35); that He was God incarnate (John 1:1,14); and that the purpose of the incarnation was to reveal God, redeem men, and rule over God's kingdom (Psalm 2:7-9; Isaiah 9:6; John 1:29; Philippians 2:9-11; Hebrews 7:25-26; 1 Peter 1:18-19).
We teach that in the incarnation, the second person of the Trinity laid aside His right to the full prerogatives of coexistence with God, assumed the place of a Son, and took on an existence appropriate to a servant while never divesting Himself of His divine attributes (Philippians 2:5-8).

C. God the Son: Redeemer
We teach that our Lord Jesus Christ accomplished our redemption through His death on the cross and that His death was voluntary, vicarious, substitutionary, propitiatory, and redemptive (John 10:15; Romans 3:24-25; 5:8; 1 Peter 2:24).
We teach that on the basis of the efficacy of the death of our Lord Jesus Christ, the believing sinner is freed from the punishment, the penalty, the power, and one day the very presence of sin; and that he is declared righteous, given eternal life, and adopted into the family of God (Romans 3:25, 5:8-9; 2 Corinthians 5:14-15; 1 Peter 2:24; 3:18).
We teach that our justification is made sure by His literal, physical resurrection from the dead and that He is now ascended to the right hand of the Father, where He now mediates as our Advocate and High Priest (Matthew 28:6; Luke 24:38-39; Acts 2:30- 31; Romans 4:25; 8:34; Hebrews 7:25; 9:24; 1 John 2:1).
We teach that in the resurrection of Jesus Christ from the grave, God confirmed the deity of His Son and gave proof that God has accepted the atoning work of Christ on the cross. Jesus' bodily resurrection is also the guarantee of a future resurrection life for all believers (John 5:26-29; 14:19; Romans 1:4; 4:25; 6:5-10; 1 Corinthians 15:20,23).

D. God the Son: Judge
We teach that Jesus Christ will return to receive the church, which is His body, unto Himself at the rapture and, returning with His church in glory, will establish His millennial kingdom on earth (Acts 1:9-11; 1 Thessalonians 4:13-18; Revelation 20). And, that the Lord Jesus Christ is the one through whom God will judge all mankind (John 5:22-23):
* Believers (1 Corinthians 3:10-15; 2 Corinthians 5:10).
* Living inhabitants of the earth at His glorious return (Matthew 25:31-46).
* Unbelieving dead at the Great White Throne (Rev. 20:11-15).
As the mediator between God and man (1 Timothy 2:5), the head of His body the church (Ephesians 1:22; 5:23; Colossians 1:18), and the coming universal King who will reign on the throne of David (Isaiah 9:6; Luke 1:31-33), He is the final judge of all who fail to place their trust in Him as Savior and Lord (Matthew 25:14-46; Acts 17:30-31).

E. God the Holy Spirit
We teach that the Holy Spirit is a divine person, eternal, underived, possessing all the attributes of the Godhead:
1. INTELLECT (1 Corinthians 2:10-13);
2. EMOTIONS (Ephesians 4:30);
3. WILL (1 Corinthians 12:11);
4. ETERNALITY (Hebrews 9:14);
5. OMNIPRESENCE (Psalm 139:7-10);
6. OMNISCIENCE (Isaiah 40:13-14);
7. OMNIPOTENCE (Romans 15:13);
8. TRUTHFULNESS (John 16:13).
In all the divine attributes He is coequal and consubstantial with the Father and the Son (Matthew 28:19; Acts 5:3-4; 28:25-26; 1 Corinthians 12:4-6; 2 Corinthians 13:14; and Jeremiah 31:31-34 with Hebrews 10:15-17).
We teach that it is the work of the Holy Spirit to execute the divine will with relation to all mankind. We recognize His sovereign activity in creation (Genesis 1:2), the incarnation (Matthew 1:18), the written revelation (2 Peter 1:20-21), and the work of salvation(John 3:5-7).
We teach that the work of the Holy Spirit in this age began at Pentecost, when He came from the Father as promised by Christ (John 14:16-17; 15:26) to initiate and complete the building of the body of Christ, which is His church (1 Corinthians 12:13). The broad scope of His divine activity includes convicting the world of sin, of righteousness, and of judgment; glorifying the Lord Jesus Christ and transforming believers into the image of Christ (John 16:7-9; Acts 1:5; 2:4; Romans 8:29; 2 Corinthians 3:18; Ephesians 2:22).

F. Holy Spirit and the Church
We teach that the Holy Spirit is the supernatural and sovereign agent in regeneration, baptizing all believers into the body of Christ (1 Corinthians 12:13). The Holy Spirit also indwells, sanctifies, instructs, empowers them for service, and seals them unto the day of redemption (Romans 8:9; 2 Corinthians 3:6; Ephesians 1:13).
We teach that the Holy Spirit is the divine teacher who guided the apostles and prophets into all truth as they committed to writing God's revelation, the Bible. Every believer possesses the indwelling presence of the Holy Spirit from the moment of salvation, and it is the duty of all those born of the Spirit to be filled with (controlled by) the Spirit (John 16:13; Romans 8:9; Ephesians 5:18; 2 Peter 1:19-21; 1 John 2:20,27).
We teach that the Holy Spirit alone administers spiritual gifts to the church. The Holy Spirit glorifies neither Himself nor His gifts by ostentatious displays, but all He does is to glorify Christ, to implement His work of redeeming the lost, and to build up believers in the most holy faith (John 16:13-14; Acts 1:8; 1 Corinthians 12:4-11; 2 Corinthians 3:18).
We teach, in this respect, that God the Holy Spirit is sovereign in the bestowing of all His gifts for the perfecting of the saints today and that speaking in tongues (unlearned foreign languages) and the working of sign miracles gradually ceased as the New Testament Scriptures were completed and their authority became established (1 Corinthians 12:4-11; 13:8-10; 2 Corinthians 12:12; Ephesians 4:7-12; Hebrews 2:1-4).`;

  const defaultBeliefs3 = `We teach that man was directly and immediately created by God in His image and likeness. Man was created free of sin with a rational nature, intelligence, volition, self-determination, and moral responsibility to God (Genesis 2:7, 15-25; James 3:9).
We teach that God's intention in the creation of man was that man should glorify God, enjoy God's fellowship, live his life in the will of God and by this, accomplish God's purpose for man in the world (Isaiah 43:7; Colossians 1:16; Revelation 4:11).
We teach that in Adam's sin of disobedience to the revealed will and Word of God, man lost his innocence, incurred the penalty of spiritual and physical death, became subject to the wrath of God, and became inherently corrupt and utterly incapable of choosing or doing that which is acceptable to God apart from divine grace. With no recuperative powers to enable him to recover himself, man is hopelessly lost. Man's salvation is thereby wholly of God's grace through the redemptive work of our Lord Jesus Christ (Genesis 2:16-17; 3:1-19; John 3:36; Romans 3:23, 6:23; 1 Corinthians 2:14; Ephesians 2:1-3; 1 Timothy 2:13- 14; 1 John 1:8).
We teach that because all men were in Adam, the consequence of Adam's sin has been transmitted (imputed) to all men of all ages, Jesus Christ being the only exception. All men are thus sinners by divine declaration, by nature, and by choice (Psalm 14:1-3; Jeremiah 17:9; Romans 3:9-18,23; 5:10-12).`;

  const defaultBeliefs4 = `We teach that salvation is wholly of God by grace, through the redemption of Jesus Christ, the merit of His shed blood, and not on the basis of human merit or works (John 1:12; Ephesians 1:7; 2:8-10; 1 Peter 1:18-19).

A. Regeneration
We teach that regeneration is a supernatural work of the Holy Spirit by which the divine nature and divine life are given (John 3:3-7). It is instantaneous and is accomplished solely by the power of the Holy Spirit through the instrumentality of the Word of God (John 5:24), so as to secure voluntary obedience to the gospel. Genuine regeneration is manifested by repentance, faith, and righteous living. Good works will be its proper evidence and fruit (1 Corinthians 6:19-20; Ephesians 2:10), and will be experienced to the extent that the believer submits to the control of the Holy Spirit in his life through faithful obedience to the Word of God (Ephesians 5:17-21; Philippians 2:12b; Colossians 3:16; 2 Peter 1:4-10). This obedience causes the believer to be increasingly conformed to the image of our Lord Jesus Christ (2 Corinthians 3:18). Such a conformity is climaxed in the believer's glorification at Christ's coming (Romans 8:17; 2 Peter 1:4; 1 John 3:2-3).

B. Election
We teach that election is the act of God by which, before the foundation of the world, He chose in Christ those whom He graciously regenerates, saves and sanctifies (Romans 8:28-30; Ephesians 1:4-11; 2 Thessalonians 2:13; 2 Timothy 2:10; 1 Peter 1:1-2).
We teach that sovereign election does not contradict or negate the responsibility of man to repent and trust Christ as Savior and Lord (Ezekiel 18:23, 32; 33:11; John 3:18-19, 36; 5:40; Romans 9:22-23; 2 Thessalonians 2:10-12; Revelation 22:17). Nevertheless, since sovereign grace includes the means of receiving the gift of salvation as well as the gift itself, sovereign election will result in what God determines. All whom the Father calls to Himself will come in faith and all who come in faith the Father will receive (John 6:37-40, 44; Acts 13:48; James 4:8).
We teach that the unmerited favor that God grants to totally depraved sinners is not related to any initiative on their own part nor to God's anticipation of what they might do by their own will, but is solely of His sovereign grace and mercy (Ephesians 1:4-7; Titus 3:4-7; 1 Peter 1:2).
We teach that election should not be looked upon as based merely on abstract sovereignty. God is truly sovereign but He exercises this sovereignty in harmony with His other attributes, especially His omniscience, justice, holiness, and wisdom (Romans 9:11-16). This sovereignty will always exalt the will of God in a manner totally consistent with His character as revealed in the life of our Lord Jesus Christ (Matthew 11:25-28; 2 Timothy 1:9).

C. Justification
We teach that justification before God is an act of God (Romans 8:33), by which He declares righteous those who through faith in Christ repent of their sins (Luke 13:3; Acts 2:38; 3:19; 11:18; Romans 2:4; 2 Corinthians 7:10; Isaiah 55:6-7) and confess Him as sovereign Lord (Romans 10:9-10; 1 Corinthians 12:3; 2 Corinthians 4:5; Philippians 2:11). This righteousness is apart from any virtue or work of man (Romans 3:20; 4:6) and involves the imputation of our sins to Christ (Colossians 2:14; 1 Peter 2:24) and the imputation of Christ's righteousness to us (1 Corinthians 1:30; 2 Corinthians 5:21). By this means God is enabled to "be just, and the justifier of the one who has faith in Jesus" (Romans 3:26).

D. Sanctification
We teach that every believer is sanctified (set apart) unto God by the death of our Lord Jesus Christ, is therefore declared to be holy, and is therefore identified as a saint. This is positional and instantaneous and should not be confused with progressive sanctification. This sanctification has to do with the believer's standing, not his present walk or condition (Acts 20:32; 1 Corinthians 1:2, 30; 6:11; 2 Thessalonians 2:13; Hebrews 2:11; 3:1; 10:10, 14; 13:12; 1 Peter 1:2).
We teach that there is also, by the work of the Holy Spirit, a progressive sanctification by which the state of the believer is brought closer to the standing the believer positionally enjoys through justification. Through obedience to the Word of God and the empowering of the Holy Spirit, the believer is able to live a life of increasing holiness in conformity to the will of God, becoming more and more like our Lord Jesus Christ (John 17:17,19; Romans 6:1-22; 2 Corinthians 3:18; 1 Thessalonians 4:3-4; 5:23).
In this respect we teach that every saved person is involved in a daily conflict--the new creation in Christ doing battle against the flesh--but adequate provision is made for victory through the power of the indwelling Holy Spirit. The struggle nevertheless stays with the believer all through this earthly life and is never completely ended. All claims to the eradication of sin in this life are unscriptural. Eradication of sin is not possible, but the Holy Spirit does provide for victory over sin (Galatians 5:16-25; Ephesians 4:22- 24; Philippians 3:12; Colossians 3:9-10; 1 Peter 1:14-16; 1 John 3:5-9).

E. Security
We teach that all the redeemed, once saved, are kept by God's power and are thus secure in Christ forever (John 5:24; 6:37-40; 10:27-30; Romans 5:9-10; 8:1, 31-39; 1 Corinthians 1:4-8; Ephesians 4:30; Hebrews 7:25; 13:5; 1 Peter 1:5; Jude 24).
We teach that it is the privilege of believers to rejoice in the assurance of their salvation through the testimony of God's Word, which, however, clearly forbids the use of Christian liberty as an occasion for sinful living and carnality (Romans 6:15-22; 13:13-14; Galatians 5:13,25-26; Titus 2:11-14).

F. Separation from sin
We teach that separation from sin is clearly called for throughout the Old and New Testaments, and that the Scriptures clearly indicate that in the last days apostasy and worldliness shall increase (2 Corinthians 6:14-7:1; 2 Timothy 3:1-5).
We teach that out of deep gratitude for the undeserved grace of God granted to us and because our glorious God is so worthy of our total consecration, all the saved should live in such a manner as to demonstrate our adoring love to God and so as not to bring reproach upon our Savior and Lord. We also teach that separation from all religious apostasy, and worldly and sinful practices is commanded of us by God (Romans 12:1-2, 1 Corinthians 5:9-13; 2 Corinthians 6:14-7:1; 1 John 2:15-17; 2 John 9-11).
We teach that believers should be separated unto our Lord Jesus Christ (2 Thessalonians 1:11-12; Hebrews 12:1-2) and affirm that the Christian life is a life of obedient righteousness demonstrated by a beatitude attitude (Matthew 5:2-12) and a continual pursuit of holiness (Romans 12:1-2; 2 Corinthians 7:1; Hebrews 12:14; Titus 2:11-14; 1 John 3:1-10).`;

  const defaultBeliefs5 = `We teach that all who place their faith in Jesus Christ are immediately baptized by the Holy Spirit into one united spiritual body, the church (1 Corinthians 12:12-13), the bride of Christ (2 Corinthians 11:2; Ephesians 5:23-32; Revelation 19:7-8), of which Christ is the head (Ephesians 1:22; 4:15; Colossians 1:18).
We teach that the formation of the church, the body of Christ, began on the day of Pentecost (Acts 2:1-21, 38-47) and will be completed at the coming of Christ for His own at the rapture (1 Corinthians 15:51-52; 1 Thessalonians 4:13-18).
We teach that the church is thus a unique spiritual organism designed by Christ, made up of all born again believers in this present age (Ephesians 2:11-3:6). The church is distinct from Israel (1 Corinthians 10:32), a mystery not revealed until this age (Ephesians 3:1-6; 5:32).
We teach that the establishment and continuity of local churches is clearly taught and defined in the New Testament Scriptures (Acts 14:23,27; 20:17,28; Galatians 1:2; Philippians 1:1; 1 Thessalonians 1:1; 2 Thessalonians 1:1) and that the members of this one spiritual body are directed to associate themselves together in local assemblies (1 Corinthians 11:18-20; Hebrews 10:25).

A. The Church: Leaders
We teach that the one supreme authority for the church is Christ (1 Corinthians 11:3; Ephesians 1:22; Colossians 1:18) and that church leadership, gifts, order, discipline, and worship are all appointed through His sovereignty as found in the Scriptures. The biblically designated officers serving under Christ and over the assembly are elders (also called bishops, pastors and pastor- teachers-- Acts 20:28; Ephesians 4:11), and deacons, both of whom must meet biblical qualifications (1 Timothy 3:1-13; Titus 1:5-9; 1 Peter 5:1-5).
We teach that these leaders lead or rule as servants of Christ (1 Timothy 5:17-22) and have His authority in directing the church. The congregation is to submit to their leadership (Hebrews 13:7, 17).
We teach the importance of discipleship (Matthew 28:19-20; 2 Timothy 2:2), mutual accountability of all believers to each other (Matthew 18:5-14), as well as the need for discipline of sinning members of the congregation in accord with the standards of Scripture (Matthew 18:15-22; Acts 5:1-11; 1 Corinthians 5:1- 13; 2 Thessalonians 3:6-15; 1 Timothy 1:19-20; Titus 1:10-16).

B. The Church: Autonomy
We teach the autonomy of the local church, free from any external authority or control, with the right of self-government and freedom from the interference of any hierarchy of individuals or organizations (Titus 1:5). We teach that it is scriptural for true churches to cooperate with each other for the presentation and propagation of the faith. Each local church, however, through its elders and their interpretation and application of Scripture, should be the sole judge of the measure and method of its cooperation. The elders should determine all other matters of membership, policy, discipline, benevolence, and government as well (Acts 15:19-31; 20:28; 1 Corinthians 5:4-7, 13; 1 Peter 5:1- 4).
We teach that the purpose of the church is to glorify God (Ephesians 3:21) by building itself up in the faith (Ephesians 4:13-16), by instruction of the Word (2 Timothy 2:2,15; 3:16-17), by fellowship (Acts 2:47; 1 John 1:3), by keeping the ordinances (Luke 22:19; Acts 2:38-42) and by advancing and communicating the gospel to the entire world (Matthew 28:19; Acts 1:8; 2:42).

C. The Church: Equipping
We teach the calling of all saints to the work of the ministry (1 Corinthians 15:58; Ephesians 4:12; Revelation 22:12). We teach the need of the church to cooperate with God as He accomplishes His purpose in the world. To that end, He gives the church spiritual gifts. First, He gives men chosen for the purpose of equipping the saints for the work of the ministry (Ephesians 4:7- 12) and He also gives unique and special spiritual abilities to each member of the body of Christ (Romans 12:5-8; 1 Corinthians 12:4-31; 1 Peter 4:10-11). At the moment of spiritual birth every believer receives such a gift or gifts (1 Corinthians 12:4-13). These gifts are sovereignly bestowed and cannot be sought (1 Corinthians 12:11). It is essential that every believer discovers, develops, and employs his spiritual gift or gifts for the edification of the body and the accomplishment of the work of Christ in the world (Romans 12:3-8; 1 Peter 4:10-11).

D. The Church: Signs and Wonders
We teach that there were two kinds of gifts given the early church: miraculous gifts of divine revelation and healing, given temporarily in the apostolic era for the purpose of confirming the authenticity of the Apostles' message (Hebrews 2:3-4); and ministering gifts, given to equip believers for edifying one another. With the New Testament revelation now complete, Scripture becomes the sole test of the authenticity of a man's message, and confirming gifts of a miraculous nature are no longer necessary to validate a man or his message (1 Corinthians 13:8-12). Miraculous gifts can even be counterfeited by Satan so as to deceive even believers (1 Corinthians 13:13--14:12; Revelation 13:13-14). The only gifts in operation today are those non-revelatory equipping gifts given for edification (Romans 12:6-8).
We teach that the confirming gifts of the apostolic period-- healing, speaking in tongues (unlearned foreign languages), interpretation, and the working of miracles--gradually ceased as the New Testament Scriptures were completed and their authority became established (compare 1 Corinthians 13:8-10; 2 Corinthians 12:12; Hebrews 2:3-4; Acts 19:11-12 with 1 Corinthians 12:1-31) until the eternal state (1 Corinthians 13:8-12).
We teach that no one possesses the gift of healing today but that God does hear and answer the prayer of faith on the part of every believer and will answer in accordance with His own perfect will for the sick, suffering, and afflicted (Luke 18:1-6; John 5:7-9; 2 Corinthians 12:6-10; James 5:13-16; 1 John 5:14-15).

E. The Church: Ordinances
We teach that two ordinances have been committed to the local church: baptism and the Lord's Supper (Acts 2:38-42). Christian baptism by immersion (Acts 8:36-39) is the solemn and beautiful testimony of a believer showing forth his faith in the crucified, buried, and risen Savior, and his union with Him in death to sin and resurrection to a new life (Romans 6:1-11). It is also a sign of fellowship and identification with the visible body of Christ (Acts 2:41-42).
We teach that the Lord's Supper is the commemoration and proclamation of His death until He comes, and should be always preceded by solemn self-examination (1 Corinthians 11:28-32). We also teach that whereas the elements of communion are only representative of the flesh and blood of Christ, the Lord's Supper is nevertheless an actual communion with the risen Christ, who is present in a unique way, fellowshipping with His people (1 Corinthians 10:16).`;

  const defaultBeliefs6 = `A. Angels
We teach that angels are created beings and are therefore not to be worshipped. Although they are a higher order of creation than man, they are created to serve God and to worship Him (Luke 2:9- 14; Hebrews 1:6-7, 14, 2:6-7; Revelation 5:11-14; 19:10; 22:9).
We teach that Satan is a created angel and the author of sin. He incurred the judgment of God by rebelling against his Creator, by taking numerous angels with Him in his fall (Job 1:6- 7; Isaiah 14: 12-17; Ezekiel 28:11-19), and by introducing sin into the human race by his temptation of Eve (Genesis 3:1-15). We teach that Satan is the open and declared enemy of God and man (Isaiah 14:13-14; Matthew 4:1-11; Revelation 12:9-10), the prince of this world who has been defeated through the death and resurrection of Jesus Christ (Romans 16:20) and that he shall be eternally punished in the lake of fire (Isaiah 14:12-17; Ezekiel 28:11-19; Matthew 25:41; Revelation 20:10).

B. Death
We teach that physical death involves no loss of our immaterial consciousness (Revelation 6:9-11), that the soul of the redeemed passes immediately into the presence of Christ (Luke 23:43; Philippians 1:23; 2 Corinthians 5:8), that there is a separation of soul and body (Philippians 1:21-24) and that such separation will continue until the first resurrection (Revelation 20:4-6), when our spirit, soul, and body will be reunited to be glorified forever with our Lord (Philippians 3:21; 1 Corinthians 15:35-44, 50-54; 1 Thessalonians 4:16-17). Until that time, the souls of the redeemed in Christ remain in joyful fellowship with our Lord Jesus Christ (2 Corinthians 5:8).
We teach the bodily resurrection of all men, the saved to eternal life (John 6:39; Romans 8: 10-11, 19-23; 2 Corinthians 4:14) and the unsaved to judgment and everlasting punishment (Daniel 12:2; John 5:29; Revelation 20:13-15).
We teach that the souls of the unsaved at death are kept under punishment in hell until the second resurrection (Luke 16:19-26; Revelation 20:13-15), when the soul and a resurrection body will be united (John 5:28-29). They shall then appear at the Great White Throne judgment (Revelation 20:11-15) and shall be cast into the lake of fire (Matthew 25:41-46), cut off from the life of God forever (Daniel 12:2; Matthew 25:41-46; 2 Thessalonians 1:7-9).`;

  const defaultBeliefs7 = `A. The Rapture of the Church
We teach the personal, bodily return of our Lord Jesus Christ (1 Thessalonians 4:16; Titus 2:13) to translate His church from this earth (John 14:1-3; 1 Corinthians 15:51-53; 1 Thessalonians 4:15- 5:11) and to reward believers according to their works (1 Corinthians 3:11-15; 2 Corinthians 5:10) with sufficient time elapsing between this event and His glorious return with His church to allow for the judgment of believers' works.

B. The Tribulation Period
We teach that immediately following the removal of the church from the earth (John 14:1-3; 1 Thessalonians 4:13-18) the righteous judgments of God will be poured out upon an unbelieving world (Jeremiah 30:7; Daniel 9:27; 12:1; 2 Thessalonians 2:7-12; Revelation 16), and that these judgments will be climaxed by the return of Christ in glory to the earth (Matthew 24:27-31; 25:31- 46; 2 Thessalonians 2:7-12). At that time the Old Testament and tribulation saints will be raised and the living will be judged (Daniel 12:2-3; Rev. 20:4-6). This period includes the seventieth week of Daniel's prophecy (Daniel 9:24-27; Matthew 24:15-31; 25:31-46).

C. The Second Coming of Christ and His Millenial Reign
We teach that after the tribulation period, Christ will come to earth to occupy the throne of David (Matthew 25:31; Luke 1:31- 33; Acts 1:10-11; 2:29-30) and establish His Messianic kingdom for a thousand years on the earth (Revelation 20:1-7). During this time the resurrected saints will reign with Him over Israel and all the nations of the earth (Ezekiel 37:21-28; Daniel 7:17- 22; Revelation 19:11-16). This reign will be preceded by the overthrow of the antichrist and the false prophet, and the removal of Satan from the world (Daniel 7:17-27; Revelation 20:1- 7).
We teach that the kingdom itself will be the fulfillment of God's promise to Israel (Isaiah 65:17-25; Ezekiel 37:21-28; Zechariah 8:1-17) to restore them to the land which they forfeited through their disobedience (Deuteronomy 28:15-68). The result of their disobedience was that Israel was temporarily set aside (Matthew 21:43; Romans11:1-26) but will again be awakened through repentance to enter into the land of blessing (Jeremiah 31:31-34; Ezekiel 36:22-32; Romans 11:25-29).
We teach that this time of our Lord's reign will be characterized by harmony, justice, peace, righteousness, and long life (Isaiah 11; 65:17-25; Ezekiel 36:33-38), and will be brought to an end with the release of Satan (Revelation 20:7).

D. The Judgment of the Lost and Hell
We teach that following the release of Satan after the thousand year reign of Christ (Revelation 20:7), Satan will deceive the nations of the earth and gather them to battle against the saints and the beloved city. At that time Satan and his army will be devoured by fire from heaven (Revelation 20:9). Following this, Satan will be thrown into the lake of fire and brimstone (Matthew 25:41; Revelation 20:10) whereupon Christ, who is the judge of all men (John 5:22), will resurrect and judge the great and small at the Great White Throne judgment. (Rev. 20:11- 13)
We teach that this resurrection of the unsaved dead to judgment will be a physical resurrection, whereupon receiving their judgment (Romans 14:10-13), they will be committed to an eternal conscious punishment in the lake of fire (Matthew 25:41; Revelation 20:14-15).

E. Eternity
We teach that after the closing of the millennium, the temporary release of Satan, and the judgment of unbelievers (2 Thessalonians 1:9; Revelation 20:7-15), the saved will enter the eternal state of glory with God, after which the elements of this earth are to be dissolved (2 Peter 3:10) and replaced with a new earth wherein only righteousness dwells (Ephesians 5:5; Revelation 20:15, 21-22). Following this, the heavenly city will come down out of heaven (Revelation 21:2) and will be the dwelling place of the saints, where they will enjoy forever fellowship with God and one another (John 17:3; Revelation 21,22). Our Lord Jesus Christ, having fulfilled His redemptive mission, will then deliver up the kingdom to God the Father (1 Corinthians 15:24-28) that in all spheres the triune God may reign forever and ever (1 Corinthians 15:28)`;

  // Build a single JSON array for the beliefs page
  const defaultBeliefsJson = JSON.stringify([
    {
      title: "I. THE HOLY SCRIPTURES",
      content: `<p>${defaultBeliefs1.replace(/\n/g, '</p><p>')}</p>`
    },
    {
      title: "II. GOD",
      content: `<p>${defaultBeliefs2.replace(/\n/g, '</p><p>')}</p>`
    },
    {
      title: "III. MAN",
      content: `<p>${defaultBeliefs3.replace(/\n/g, '</p><p>')}</p>`
    },
    {
      title: "IV. SALVATION",
      content: `<p>${defaultBeliefs4.replace(/\n/g, '</p><p>')}</p>`
    },
    {
      title: "V. THE CHURCH",
      content: `<p>${defaultBeliefs5.replace(/\n/g, '</p><p>')}</p>`
    },
    {
      title: "VI. THE SPIRITUAL REALM",
      content: `<p>${defaultBeliefs6.replace(/\n/g, '</p><p>')}</p>`
    },
    {
      title: "VII. FUTURE THINGS IN SCRIPTURE",
      content: `<p>${defaultBeliefs7.replace(/\n/g, '</p><p>')}</p>`
    }
  ]);

  // Insert initial data for Home Page and Beliefs Page as a test
  const initialContent = [
    { page_name: 'home', content_key: 'hero_title', content_value: 'Messiah Baptist Church' },
    { page_name: 'home', content_key: 'hero_subtitle', content_value: 'Preaches what the Bible Teaches' },
    { page_name: 'home', content_key: 'hero_image', content_value: '' }, // default CSS handles the empty bg for now
    { page_name: 'home', content_key: 'pastor_image', content_value: './images/pastor.png' },
    { page_name: 'home', content_key: 'pastor_name', content_value: 'Andres C. Guevara Jr.' },
    { page_name: 'home', content_key: 'pastor_role', content_value: 'PASTOR' },
    { page_name: 'home', content_key: 'pastor_quote', content_value: '"We are so glad you visited our website. It is our privilege to have you as our special guest. We assure you this is the place you are looking for. It is our purpose to glorify God and help you to live in His will.' },
    { page_name: 'home', content_key: 'pastor_highlight', content_value: 'PLEASE COME AND VISIT US. Bring your family and all your friends!"' },
    { page_name: 'home', content_key: 'schedules_json', content_value: JSON.stringify(defaultSchedules) },
    { page_name: 'home', content_key: 'messages_json', content_value: JSON.stringify(defaultMessages) },
    { page_name: 'global', content_key: 'church_address', content_value: '145 Rivera St., Baesa Rd., Caloocan City, Philippines' },
    { page_name: 'beliefs', content_key: 'beliefs_json', content_value: defaultBeliefsJson }
  ];

  const stmt = db.prepare('INSERT INTO page_content (page_name, content_key, content_value) VALUES (?, ?, ?)');
  initialContent.forEach(item => {
    stmt.run(item.page_name, item.content_key, item.content_value);
  });
  stmt.finalize();

  // Insert initial bible studies data
  const initialData = [
    { category: 'BIBLE LESSONS', title: 'Bible and Homosexuality', link: 'http://www.messiahbc.com/biblestudies/bibleandhomosexuality.html' },
    { category: 'BIBLE LESSONS', title: 'Bible Reading', link: 'http://www.messiahbc.com/biblestudies/biblereading.html' },
    { category: 'BIBLE LESSONS', title: 'Biblical Basis for Local church Membership', link: 'http://www.messiahbc.com/biblestudies/biblicalbasisforlocalchurchmembership.html' },
    { category: 'END TIMES PROPHECY', title: 'Israel in the Tribulation', link: 'http://www.messiahbc.com/endtimesprophecy/israelinthetribulation.html' },
    { category: 'SALVATION LESSONS', title: 'The Gospel', link: 'http://www.messiahbc.com/shorthomebiblestudies/gospel.html' },
  ];

  const stmt2 = db.prepare('INSERT INTO bible_studies (category, title, link) VALUES (?, ?, ?)');
  initialData.forEach(item => {
    stmt2.run(item.category, item.title, item.link);
  });
  stmt2.finalize(() => {
    console.log('Database fully initialized.');
    db.close();
  });
});
