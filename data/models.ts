
import type { Model, Post } from '../types';

const generatePosts = (modelName: string, filenames: string[]): Post[] => {
  return filenames.map((name, index) => ({
    id: `${modelName.replace(/\s+/g, '-').toLowerCase()}-p${index}`,
    src: `/Stock Photos/${modelName}/Page/${name}`,
    type: 'image',
    caption: `Portfolio ${index + 1}`,
    tags: ['fashion', 'model'],
    pinned: index === 0
  }));
};

const generateGroupedPosts = (modelName: string, filenames: string[]): Post[] => {
  // Deterministic order (no shuffle)
  const sourceFiles = filenames;
  
  const posts: Post[] = [];
  let fileIndex = 0;
  let postCount = 0;
  
  while (fileIndex < sourceFiles.length) {
      // Deterministic group size using index
      // Pattern based on index to mix 1s, 2s and 3s
      const n = fileIndex;
      // Simple pseudo-random function
      const pseudoRand = ((n * 9301 + 49297) % 233280) / 233280; 

      let groupSize = 1;
      if (pseudoRand > 0.70) groupSize = 2; // 20% chance
      if (pseudoRand > 0.90) groupSize = 3; // 10% chance
      
      // Ensure we don't go out of bounds
      if (fileIndex + groupSize > sourceFiles.length) {
          groupSize = sourceFiles.length - fileIndex;
      }

      const group = sourceFiles.slice(fileIndex, fileIndex + groupSize);
      const fullPaths = group.map(name => `/Stock Photos/${modelName}/Page/${name}`);
      
      posts.push({
          id: `${modelName.replace(/\s+/g, '-').toLowerCase()}-p${postCount}`,
          src: fullPaths[0],
          images: groupSize > 1 ? fullPaths : undefined,
          type: 'image',
          caption: `Portfolio ${postCount + 1}`,
          tags: ['fashion', 'model', 'editorial'],
          pinned: postCount === 0 || postCount === 1 // Pin first two for "Popular" effect
      });
      
      fileIndex += groupSize;
      postCount++;
  }
  return posts;
};

const alexandaraFiles = [
  "Whisk_0ywzin2yhrtoiztytywzyewl1e2n00cmzezmtmt.jpeg", "Whisk_111bdf931482d06acc047405fa94bfe3dr.jpeg", "Whisk_2d95720ebb97d30a69b431a3afc30b9cdr.jpeg",
  "Whisk_2eff7021de12408b2ef41a17458bc836dr.jpeg", "Whisk_2ujnjdtykjwo4czntazn5gtlzczy00cowymntmj.jpeg", "Whisk_4ezy1qgoxgzylftytymn4iwl2ugn00ynhrgmtgz.jpeg",
  "Whisk_5964da563939623af8a49a0f032023c6dr.jpeg", "Whisk_5izyhvtomrtn5ytytugzziwlzmtn00cowudotcj.jpeg", "Whisk_7bf28c00c61b786a22c440fa53923edadr.jpeg",
  "Whisk_ajn0iwmlr2mzejyh1iymfgotizyxqtl4ymmi1co.jpeg", "Whisk_atm0etozmtzwajn40in4gjytctnmrtl0kjmj1co.jpeg", "Whisk_czmyczymjto3u2y40so3ewytczmkrtl3qwzw0co.jpeg",
  "Whisk_e1812184481646899d24ff5a884b6067dr.jpeg", "Whisk_e33ae98113a1d8daca04b732dd30c528dr.jpeg", "Whisk_e4354fccdfbdb9fb21d4bfeb7c412043dr.jpeg",
  "Whisk_emzxgznjbjmwutnj1sozijytedzwqtl0ytyj1cm.jpeg", "Whisk_ewnkftnlrdminwol1sn1adotywmyqtlzmzmx0co.jpeg", "Whisk_gdzhrmmkrgmhr2n50iyycjytitzkrtl2etzl1iz.jpeg",
  "Whisk_igz1u2nzugn3yto00izlvdotiwn2qtlkrgnz0iy.jpeg", "Whisk_imy2mdo5ijm4yzny0iy1qgotmznzqtlmvtm10co.jpeg", "Whisk_iwozywn3mtzhhtz10iywqmytqjnhrtl4uzmi1sz.jpeg",
  "Whisk_jn2mxujyykznlvjmtugmxktlygzm00ym3cjntmt.jpeg", "Whisk_knjzmjgzjrtohfgzti2n2iwlifwm00iyxizmtij.jpeg", "Whisk_mmy0idnwmjzhjjm00ynyydotmmm2qtl3q2m40sy.jpeg",
  "Whisk_qmmhjdm5idz5ewn50cmygtytijy2qtljldm40in.jpeg", "Whisk_qmyinmnxmtnjvmym1so1imyte2y2qtlknwo00so.jpeg", "Whisk_qwy5ujymvmnwkdmj1im2qtytugozqtlwmgm40sn.jpeg",
  "Whisk_ugnhbjnhbznwummw0iy2mtotqzn4qtl3e2y20yn.jpeg", "Whisk_ujzmhdmjvmn0mjmm1cnhfmytymnwqtl1ajz10so.jpeg", "Whisk_umzlzgmwgjmjj2yy0sn4qwotgdmwqtl2utm20cm.jpeg",
  "Whisk_utm3cdmwygnyiwnk1smhrwytydmyqtlzumn20cn.jpeg", "Whisk_wqjyzijnzimm1immtgzm5ktl5ugn00soycdztkz.jpeg", "Whisk_xajnwatzzkjz2utytm2yxiwlibtm00snxq2mtyw.jpeg",
  "Whisk_ymy0kto0emy1ugo30im3ctotmdn1qtljjwm40ym.jpeg", "Whisk_ymz2ymzwemz5ywzi1ym4utotijnwqtl0qjz00co.jpeg", "Whisk_yznlltmmfgmzgtmz0ym1ywytkznyqtl5eto10iy.jpeg"
];

const kylaFiles = [
  "Whisk_20fb7e3ce5706f2ae5247c6c95538f01dr.jpeg", "Whisk_213baeea50aa497bcd84ddca935078f4dr.jpeg", "Whisk_282f192cf20b23aa94a43008569a39f3dr.jpeg",
  "Whisk_30af8cf6bf5a864bee34da2e65e14b21dr.jpeg", "Whisk_41f512d31177e7dbb3945a9094ce408fdr.jpeg", "Whisk_4fb6316a533a708b6a140610a2f60362dr.jpeg",
  "Whisk_8af983ece2c8ff091bc4bb8fc4de9300dr.jpeg", "Whisk_90be44cfd06a1c4911c4e8897739cac4dr.jpeg", "Whisk_95b538c3a50112b95d44550b5f140987dr.jpeg",
  "Whisk_976f2bf1f0043a6bbc34b238a3a70accdr.jpeg", "Whisk_a4662f16f92988090924674effda4cbbdr.jpeg", "Whisk_a8335455312dc8da1374a7c24568ef4edr.jpeg",
  "Whisk_c32d37399e561f8964347b4d3f4525dcdr.jpeg", "Whisk_d3545f574e5ffc5b9bd4f87fc734d5cadr.jpeg", "Whisk_e03198e24f7c0f395c54604c2eb63d27dr.jpeg",
  "Whisk_e14c784e24ebf6cb30a467008a09352cdr.jpeg", "Whisk_e18204d5d01097692ad4faeafa231ffedr.jpeg", "Whisk_f0155b72d195d5b8c7d47610c509b699dr.jpeg",
  "Whisk_fff3a54297847288ce843fc43f1a676ddr.jpeg"
];

const victoriaFiles = [
  "Whisk_00c4735edafb79fbc1342d39745b86a8dr.jpeg", "Whisk_0b89a58e91edb17998b4dc38d70852abdr.jpeg", "Whisk_0e3e0053afc5253b62d4282547a2eb4cdr.jpeg",
  "Whisk_1dbff19cc73faa6856a41edd0deb3280dr.jpeg", "Whisk_1ef42d7d4c970a69f784a04f9c8ea31edr.jpeg", "Whisk_2156c0b38264bbca66b45674e3b035dfdr.jpeg",
  "Whisk_47a325f092cf330b7d249906e343a678dr.jpeg", "Whisk_493b5696b1328cdb85040d9b7c53cf61dr.jpeg", "Whisk_498061a99a16909914648108b33537ccdr.jpeg",
  "Whisk_4d19205f477322c9f1b4b452c0bcc659dr.jpeg", "Whisk_4dfb3091c9fa2c3831a4c65785292eeadr.jpeg", "Whisk_59be8ee010595b088cc47fbc4b20b92fdr.jpeg",
  "Whisk_63f410384fdb927b2f74b51d4737c227dr.jpeg", "Whisk_6d486b0c2334fd38a5b4970e6e940333dr.jpeg", "Whisk_6f4c2f03bbe98debfb941b5c762ae40adr.jpeg",
  "Whisk_726215ad3bd2c97b19540abaf0429977dr.jpeg", "Whisk_734f7124553c87b9ebd44b73b871235cdr.jpeg", "Whisk_7d8096ef550e2d48e6d4716a1ebbdf41dr.jpeg",
  "Whisk_7effcb11625a9f398c649625bfe2df91dr.jpeg", "Whisk_80881e864fc0c87b67a49f97108a1c09dr.jpeg", "Whisk_839a192576b270a86ab4222664c9642fdr.jpeg",
  "Whisk_8a8ee4e6fa23d3d9e6b4a45fbdc4f05cdr.jpeg", "Whisk_8cc09ad6b73cbd387e54e6222f525d0cdr.jpeg", "Whisk_8dfa4440b4bcc2ab52d4fd121ed4bc3ddr.jpeg",
  "Whisk_94f41fe159ee9a7b78e434bf08b452d9dr.jpeg", "Whisk_9b21ad593447a91805f4c030fd3fa4c3dr.jpeg", "Whisk_af3310447de9789816d44f162b25ed7edr.jpeg",
  "Whisk_b1e9e26d1e90debbe5b43e65a1283f10dr.jpeg", "Whisk_b308d6c005d69beb1ce43509dcb7717ddr.jpeg", "Whisk_b590e21c290d0ed88b948ab2f305744bdr.jpeg",
  "Whisk_b61a463b48ebed189bd44bdc6110f539dr.jpeg", "Whisk_bdaf7be793b7f2ca6fd44686b08b6f03dr.jpeg", "Whisk_be5dd75d344430082a848bba09f64d44dr.jpeg",
  "Whisk_bfada83c07ae51582cc4b235c2c439d4dr.jpeg", "Whisk_c1f02d5ded13caa9d514c1cafc238fbadr.jpeg", "Whisk_d928ff482ebe66f94dd4f3a424487993dr.jpeg",
  "Whisk_e0fca0c6d017f0d8d6a4d05cbb0a210adr.jpeg", "Whisk_e1e8ff3ce11588ea9db4d4f2d0e8179edr.jpeg", "girl.png"
];

const lorenFiles = [
  "Whisk_kdmjlzn3izn2ugoh1sy1gjytmgokrtlhljz50iz.jpeg", "Whisk_kjmlnjmmjdokhzn50ymhdjytqdzmrtl1ygmk1sm.jpeg", "Whisk_mgnmfzyizwyxejn30sn3ydotczy5qtl0gdo10yn.jpeg",
  "Whisk_qmz2ugoirwyyqtzz0imyqdotigz5qtl3ewn30so.jpeg", "Whisk_uzmlhtolzgnxgtm20szzatytgznzqtlizdzi1co.jpeg", "Whisk_ywylnmn0kdnjrmz30inyktotemy2qtl0m2y20yy.jpeg"
];

const pamelaFiles = [
  "Whisk_0atnjbtozqwnkzzmtqtoljwlmzmn00so1ktytit.jpeg", "Whisk_0cjmlfdo3qtowyzntmjnwewlwudz00cm3gdotit.jpeg", "Whisk_0cjn5ytnlvtzkhjmtuwojltl4uty00cokdzmtcd.jpeg",
  "Whisk_0ewz1ktm0etmwqtotigz4gtlwmto00cziz2mtgz.jpeg", "Whisk_0gjmxudz5ctzkfdztcjzwktljdtn00ym4ezntm2.jpeg", "Whisk_0ijnlbdmizwzxgtztatz5ktlyy2y00cmkftyty2.jpeg",
  "Whisk_0ijzxqwzkbtmknjmtazmkfwlwqwm00iyxudoteg.jpeg", "Whisk_0iwzxajm0gdnye2ntqwnyktl4e2n00cnlhdmtmw.jpeg", "Whisk_0kzmzigz3iwylrtotktn3ktlkfgm00sowqwztem.jpeg",
  "Whisk_0m2y3yjnzgtn1cdmtmwnmjwl3gdz00sziltntgj.jpeg", "Whisk_0mjmijdmlfjzmntytgdm4ktlzkjz00inyygmtuz.jpeg", "Whisk_0mwnjjzmhrdz3azntiwzzktlhrwm00cm4ejytgd.jpeg",
  "Whisk_0qwohvgmhzjmmzmztadz5iwl4kzy00czxy2ntgd.jpeg", "Whisk_0udz0ajnhrmmwgjntajy4gtlkvdo00cmlftztgt.jpeg", "Whisk_0ydzxctowudo2qtntumzyktl0umz00yymzwmtmm.jpeg",
  "Whisk_1i2n0uwzmz2nzqjntigm2ktlmftn00co5qwytug.jpeg", "Whisk_1idnknmyzmtzkrdntmwzlfwl3mgm00sz5mzntmg.png", "Whisk_1kzmlljymjto1i2ntqtyziwlknmz00iyyygztqz.jpeg",
  "Whisk_1mmnkftz4qdmhrdztatz0ktl1ydo00yyxydotad.jpeg", "Whisk_1y2nlvdmldznwqzmtqgzhhtl0e2n00iy4ctmty2.jpeg", "Whisk_1y2yjrdnlbjnlzmztezy2ewlllzy00ymmvmmtid.jpeg",
  "Whisk_1yznhngn3aznkjmytizyxiwlkjzn00im2egotuj.jpeg", "Whisk_20080c0723d7f60b50240c5b323fb80edr.jpeg", "Whisk_26f1a116e39906e992e411232c2f96a6dr.jpeg",
  "Whisk_2adz5eto4qdnlj2mtqmn0ewlwqgm00ymihtytm2.jpeg", "Whisk_2emywadozcdmmhtmtitzzgtlmrjz00snhjtntkz.jpeg", "Whisk_2eznzudzijznxgdmtywzkjwl2itm00cz0qmytyt.jpeg",
  "Whisk_2gtnwido4mgn2azmtqwnmltllfwn00inxejztmm.jpeg", "Whisk_2gzyihznzqdo1ktytmdo1ktlzuto00ymhhjytmt.jpeg", "Whisk_2iwoibjylrgn2egntqznzewl0atm00smzqdmtmd.jpeg",
  "Whisk_2ktoxutz0gznwimmtqmnyiwlibjy00iz5ymztet.jpeg", "Whisk_2mjyzktz0ugoljgmtgtnyiwl1etm00in0qwntkd.jpeg", "Whisk_2mwnlfjyhbjzzymmtety5ktl5i2n00smkrjztim.jpeg",
  "Whisk_2qdzxydm4ymm4etztuzm2gtl1y2m00yn4ajmtut.jpeg", "Whisk_2qwyzqtnhnzy5ewmtywm4gtlkbjz00szmjwztmj.jpeg", "Whisk_2ujm4ewm2ajm0itytiwoifwlhzgz00cn4qjytmg.jpeg",
  "Whisk_2ydn4yzmlvjy5umytcdnziwlldtz00ynxedotqj.jpeg", "Whisk_3ajmjjdn4iwo4ydmtygnkltl2cdo00so0ytotuw.jpeg", "Whisk_3cjnjnty0yjzxqzmtewmkjwl4adn00yn0ejntet.jpeg",
  "Whisk_3edoidtnxitnmjtztajz1ewlhjtz00co1cdztez.jpeg", "Whisk_3ejmwuzmjfjz3qtytmjn4iwl2gty00snxktytiz.jpeg", "Whisk_3ejnjr2mirjyxmznty2nxiwl3emn00ynmhtztmw.jpeg",
  "Whisk_3ejzwymm1idnkfwmte2m1ewlyqgm00czhvzmtmz.jpeg", "Whisk_3ewy2mmz1qjnzqtztmty5ktljjmn00colndntkt.jpeg", "Whisk_3ezy4qdm1cjzmhdztkjz2gtlzgdz00sz5atmtiw.jpeg",
  "Whisk_3gdokj2nifwz5etytetzifwl0uwz00sz2gzytut.jpeg", "Whisk_3iwm3gdzxmwy2e2ntutzwgtl1ydn00solbdotmg.png", "Whisk_3kdzzydm5qwz0ytmtu2myewl1iwm00czzmjztiz.jpeg",
  "Whisk_3ktm1ujy0idn0edztatomjwljzmn00czlbjmtqm.jpeg", "Whisk_3ktn0ugnzy2n5qgotytzyewl1cdm00inwyjntij.jpeg", "Whisk_3q2n3qzykvwykjmytyjykltllnjn00yn3y2ytmm.jpeg",
  "Whisk_3ujmkzdn1izywadmtytnwewlkrmn00in3ktytmg.jpeg", "Whisk_3ujmwcdm4ujm1ctotm2yxiwlmvgz00cmxywytut.jpeg", "Whisk_3ujnmddzjhtz3ymztutzmltl5kdo00cz3azntem.jpeg",
  "Whisk_3ydnifwzlvdnifgmtkdowgtl4ktz00snwgzntaj.jpeg", "Whisk_3ydojddo4mjzifgztmjy1ewl0ezy00im5yzytqw.jpeg", "Whisk_3ytn4mgz2idozmwmtgjzygtlmrdn00iy5izmtyg.jpeg",
  "Whisk_3ytzkzmzjhjmjj2ntimz1ewlkfdm00cnhrtntct.jpeg", "Whisk_42acaa341f17385bed84f59fbcef8731dr.jpeg", "Whisk_4cdojv2yxqty3czmtidz3ewlkrwo00smmlzmtmj.jpeg",
  "Whisk_4czymjwzhrty4atotadn5gtl4mjn00ymwu2ntyw.jpeg", "Whisk_4emm5mmnwkdnkdzytktnjhtlin2m00im5ezytq2.jpeg", "Whisk_4ety3izy5gjnyadotqtnjjwl2ujm00iz3utnte2.jpeg", "Whisk_4fec9bb9a01a21a91ab4400f8d2b7833dr.jpeg", "Whisk_4imzze2y0czyxuzmty2nxgtllrjn00inmndntuz.jpeg", "Whisk_4izm2mty3itmzqmmtqdzhhtl1u2m00cnjbzmtgt.jpeg",
  "Whisk_4kzm4y2n4i2m3gdntazmzewlkvzn00im0mmmtmm.jpeg", "Whisk_4mtzjz2nwkdo4kdotytohhtlygjz00so3qzytiz.jpeg", "Whisk_4ummkfwzxaznyktmtmjn2ktlzujn00cn5itoti2.jpeg",
  "Whisk_4utmhjjmxmzmyctytgtz0ktllzwn00cmxi2ntaj.jpeg", "Whisk_4uwn1cdnzkdm1iwztgdn4gtlhfjn00cnxmgmtcz.jpeg", "Whisk_5bf77e749600755be0c4bc2dda7cbd95dr.jpeg",
  "Whisk_5edzwgdn3mgz2immtmznyktllzzm00smivwotez.jpeg", "Whisk_5ewzzetm5qwo1qzytmdz1iwl0adz00sy4kjytmw.jpeg", "Whisk_5gtmhzdn2gtm2ydztqwzwiwlygzn00yn2ummtgt.jpeg",
  "Whisk_5gtz1y2n1ewojbjztmgzkjwl1ijn00ymwajntez.jpeg", "Whisk_5igowqgz0umy3ijntqgm0gtl0ejy00ynmnmztij.png", "Whisk_5imm0mto2ijm1q2mtatmxewlmlto00inwi2ntmw.jpeg",
  "Whisk_5q2y5ywmjzzywqtztytmyewllngo00sn4ejytuz.jpeg", "Whisk_5qgminmmjnjnzqdntqwyyewlyito00sz2ktztuz.jpeg", "Whisk_5ugozywoizzyygzntazy2iwlmhdo00colfgotct.jpeg",
  "Whisk_5y2n3udmwkjnjv2mtu2y4ktl3ajy00ynjrdztim.jpeg", "Whisk_5ygn4yjnmhtnhrgotywmlltlmvdm00cn5egmtaj.jpeg", "Whisk_5ymyzmmmwcto4qtmtuznjfwl2qtn00ymjvjmtmt.jpeg",
  "Whisk_5ywzlfwmye2yiljntgzyjltlkrjz00snkfmntcj.jpeg", "Whisk_602a6fa6195f644a0304b36c5d6f24cadr.jpeg", "Whisk_650a51ae83d29c4b7f648fa4e87cfe92dr.jpeg",
  "Whisk_675aa0f602026eda7fc4691f2b30bf3edr.jpeg", "Whisk_70c66bd3aa06d7ba27d455bda7577b4bdr.jpeg", "Whisk_8976167fbd33be98047453db4d382a17dr.jpeg",
  "Whisk_8d5f2a6e431ece49dd041581ef9ca512dr.jpeg", "Whisk_8fc871b4d310062bf974daed11daa9ebdr.jpeg", "Whisk_90a727315da5506b9b5460d019368f3cdr.jpeg",
  "Whisk_97ca4960cacc713acce47ab466acd2d7dr.jpeg", "Whisk_a036959e9e4996e882743035e779309adr.jpeg", "Whisk_b69c80182ac3c9ba727445c03d475256dr.jpeg",
  "Whisk_de71bfa1ca5ca81b6f44c8b304b14010dr.jpeg", "Whisk_hf2yzetojzwmhvdotcznyktl1edm00czljjmtm2.jpeg", "Whisk_hfgohr2nzkzmxmtntcjzwktlwqty00szhnzytm2.jpeg",
  "Whisk_hfmy2u2y0mwmlfdmtaznkjwl5y2y00yy2qdmtyz.jpeg", "Whisk_hfto5gdzjhdz3yjytigowktljljy00snlhtztim.jpeg", "Whisk_hftyzatzjnwz0uzntgtnihtl2iwo00yyibdmtut.jpeg",
  "Whisk_hjgzyqgoxmdmlhdoteznmhtl3ewo00izlhjztkz.jpeg", "Whisk_hjjnzqdm0adzjzdntczn0ewl2ajz00yy2yzntij.jpeg", "Whisk_hjmmzmwzzmdnxgzytijywiwl1ajm00izxqgotqj.jpeg",
  "Whisk_hjwo3ytyzmtzlnjytqzmhjwl2ewy00im2qjntem.jpeg", "Whisk_hrgojfgoxqtnwiwntemmyewl5ego00syygdztmt.jpeg",
  "Whisk_hrwmwijy1qmyyajmtiwoyktl4iwo00inyazytum.jpeg", "Whisk_hvjm5iwo4y2mxczmtywmlhtlymty00colnjmtmz.jpeg", "Whisk_hz2mhjjn2qtmlbjztedzwktl0ytz00inlrwytud.jpeg",
  "Whisk_hzgzxedn5ujnlzgztimm0ewlhzwm00smlhdmtqt.jpeg", "Whisk_idjykjtnzqwzivzytcjziltlidzm00sz5ewztij.jpeg", "Whisk_idtojhtyymtmyetntadzhjwl4udz00czjljntat.jpeg",
  "Whisk_ifwz0ctozgjywkjztgtnjhtlxcjm00snjnjmtgt.jpeg", "Whisk_ihzykfgmknznzczmtm2mwiwlhvgo00co5etmtum.jpeg", "Whisk_ijtyxgdzyktoijwztqdnifwllfwy00iz5egotat.jpeg",
  "Whisk_iljz2egzxymzyujytumz2gtl4gto00cokrwytmm.jpeg", "Whisk_iltnwqwn2i2yljzmtetn0iwlkrdm00sowujytqd.jpeg", "Whisk_in2yykzykzzmze2nte2mlhtl0imz00soljjmtm2.jpeg",
  "Whisk_ingoxywn3ygn2ugotezmlhtl4mdm00cm0mtytym.jpeg", "Whisk_injy4eznjndojjdztejm3ktljvgz00sylrgztq2.png", "Whisk_intm3itn5edo5mtytmdmiltlwydo00imze2ytuw.jpeg",
  "Whisk_irzm0q2y5izn2yzmtigmhltl4mmz00cn1qdztmg.jpeg", "Whisk_ivgz4mtyzywz1ewotetmlfwlxi2m00im2emmtuw.jpeg", "Whisk_ivwoxi2y0emz5yjytmwo4ktl4itm00szlldztcz.jpeg",
  "Whisk_jhdnwkzywuzmzqmztezniltlindm00sn3ktntqm.jpeg", "Whisk_jhzmwugz4ywmwi2ntqzm2ktlyetz00coxyzytkj.jpeg", "Whisk_jjdmjbtzwejn0admtcty0ktlmbtm00iz3kzntgd.jpeg",
  "Whisk_jjgzkfgzzmtzxkdztgjm2ewllhzn00szmzwntij.jpeg", "Whisk_jjwnxy2ykndnhbjytgto2ewl3edo00cokftmtkj.jpeg", "Whisk_jljnkhzn2ajyymgztidmihtlhdzm00cnxuzyte2.jpeg",
  "Whisk_jntnhvtzxumnmjjztctylhtlzkdn00cm3uwotqw.jpeg", "Whisk_jrmmmrwykdzmwigztimy3iwljfzm00ynkzgmtem.jpeg", "Whisk_jrwyyqty4ewoihdztydzygtl4adm00yy1kdotyt.jpeg",
  "Whisk_jvdzyujmhljn1ydztegzygtlmljm00smmbzmtct.jpeg", "Whisk_jvgnhhdozmmmzijytitoljwl4mmy00smwgtmtij.jpeg", "Whisk_jvtzwytm5utzjfgotemywiwl0ywn00czxutztew.jpeg",
  "Whisk_jvwoinjn5udmwiwmtmtzjfwlxydz00cmmvgotet.jpeg", "Whisk_jvzm4iwoyewykhzytywmyewl5umy00syjjdztad.jpeg", "Whisk_kfgohrwylftz4idmtmmykhtlkzto00cm2ejzted.jpeg",
  "Whisk_kfmm2gto5egmwmtyti2yifwlmvjy00yyhhjytet.jpeg", "Whisk_kftmzktzlzwoxuwmtajn5ktljhtz00cn0itmtqm.jpeg", "Whisk_kjdnjz2yirgm1edntqwmkfwlzazm00yyingztem.jpeg",
  "Whisk_kjjnmjgzhzgo1egztczm5gtlykzn00cnhzwmtmg.jpeg", "Whisk_kjjz1ewnkr2nmhzntemnmltlizdz00yy4iwytig.jpeg", "Whisk_kldm1mjmjvtmmvtztkjm1iwllvgz00iyhvtotuw.jpeg",
  "Whisk_kltz3m2myyjmxktmtmtowewl0igm00czljtytym.jpeg", "Whisk_kn2nxatylzgzxkzytctmlltl4kdz00snhjjztit.jpeg", "Whisk_knmmkrdnkztmlfdmtqgn4ktlyywn00ym5edotez.jpeg",
  "Whisk_kntmycdm0qwnzytztemmyktl0ymz00yy1ktntqw.jpeg", "Whisk_knznzkzyjzmz1yjmtiwy4gtlzmdn00iy5ytote2.jpeg", "Whisk_krdo4ctmkdto2edntmtn2ktlmfwy00yyjfwntqw.jpeg",
  "Whisk_kvznjftn4ctyzkjmtetnhhtl1mdn00czkvdntct.jpeg", "Whisk_kz2m4kjnjljm4kzmtumzyewlxigo00so1egoted.jpeg", "Whisk_kz2yidjymldokjjntewm5iwllzdo00sz4etytkj.jpeg",
  "Whisk_kzdo5umymhzmjjgotigzifwl1iwn00szwutytkd.jpeg", "Whisk_lbdombdo1yty0yzntgjz5gtl1imn00cm2atotmj.jpeg",
  "Whisk_lfjnhv2nwadm0uwntkzyxktlxkdo00iyjltmtuw.jpeg", "Whisk_lfzmxuwz1iznxiwntuwzlltl1mmz00ymwmtytug.jpeg", "Whisk_lhdmkngowumz1qwotywziltl2ign00cm3edztqt.jpeg",
  "Whisk_lrgo5i2nyedo3mgotqwz0iwlyq2n00soldtmty2.jpeg", "Whisk_lrjzhzjyln2y1gdmtajm4ktlyuwn00iyhzmztqt.jpeg", "Whisk_lrwzzcdm3kjnkbjzteto5gtl3czn00iylj2ntcd.jpeg",
  "Whisk_lvzmidtnyedoyadmtemn0ewl0ydz00czkzjytqt.jpeg", "Whisk_lzgz1u2njfjy0y2mtkjn3ewl5etn00sywgzytgd.jpeg", "Whisk_mddn5ejy3ato5ujytimm3gtlwmwo00cmzqdnte2.jpeg",
  "Whisk_mfjz1mwzxu2m5mjntutyjhtljzjm00imizzntaj.jpeg", "Whisk_mfmyzigzzezmwqgmtgzyhjwl5ytz00sy2utmtum.jpeg", "Whisk_mfwn4gzy0ygnllzntidmjltlwgjm00cmxuzntet.jpeg",
  "Whisk_mjjmzijyzqwzymtytkdo5gtlhf2m00in0idmtum.jpeg", "Whisk_mjzyxutoyemmzgdztmgnlfwl3uzn00sy5ezmtgj.jpeg", "Whisk_mldn5ito5azmwu2mtytozktlzuty00cmkbzntut.jpeg",
  "Whisk_mntmhddnxqtzmzdmtqgzmltl2mzy00cnmhtnte2.jpeg", "Whisk_mntzxign2mwohhtotednyktl3egn00symrtzti2.jpeg", "Whisk_mnwy2ymzxywy4gjntutzmfwlhzgz00so5qwotqg.jpeg",
  "Whisk_mrdzkhjyhj2y3qmztq2y0ewl5ydz00co0etztat.jpeg", "Whisk_mrgoxmzmwmto4ktntezykltlmzjm00snjvdntew.jpeg", "Whisk_mrjnmjzmwetz3ujztm2m5ktlkfjz00iyibjytmm.jpeg",
  "Whisk_mrmzxymzwemy2mtntm2mzktl5czy00syhzdntgt.jpeg", "Whisk_mrtoxymz2ednhbdmtqdzlhtl0adn00in2ktytyj.jpeg", "Whisk_mvmy3mjnhrtmmrjztewzifwl0mjy00szyuzytuj.jpeg",
  "Whisk_wazyhn2ykljn2ezytgdmjltlyugn00cz3ytmti2.jpeg", "Whisk_wczm3kzn5ydo2qjntgtz0ktl1qzm00im1kdntyt.jpeg", "Whisk_wejnjf2yygdm3ujztmwywktlxuzy00inxigotij.jpeg",
  "Whisk_wemmhdjmhdzyinwytctm2iwl1cjy00ym2egntum.jpeg", "Whisk_wezn4cjm3utnmrwntkdo2ewl2egn00inxmzntkt.jpeg", "Whisk_wgto1mdzjjjyzedmtgzmifwlhdto00somrtztid.jpeg",
  "Whisk_wi2yyqmz5yjywmmntyjylhtlifmm00cozitztmz.jpeg", "Whisk_wkzmihjmlzwzzqmntajnwiwllljm00so5qmmtyd.jpeg", "Whisk_wmdzxmgm5edzinwotygoziwlzutn00sy0yzytut.jpeg",
  "Whisk_wmtyyktozegn4ktmtmzn0iwlxctz00cnyqmztew.jpeg", "Whisk_wmtzlvjmwq2yhvtztgty3ktlhvwo00so4mwytyd.jpeg", "Whisk_wq2y2qty2qwnldzytygzlhtlwuzy00syirzntkz.jpeg",
  "Whisk_wqdo0mjyzadzmzgztutm4iwl2qzn00szzcdztud.jpeg", "Whisk_wqmylhto5cjz0yjmty2yyiwlxcjz00imkfgotcd.jpeg", "Whisk_wujmhbdzkjjnmltntidmxktlxgtz00snxitotaj.jpeg",
  "Whisk_wuwzlrwymdzm5ejytqzy3ktl1qdo00smzgjztut.jpeg", "Whisk_wyjzmldmkdzn4igztgtylhtl0qty00cm1mtmtez.jpeg", "Whisk_xedojzwy2y2n3q2ntytn2iwlwedn00smzmtztug.jpeg",
  "Whisk_xejm0qmyhzmyjbdmtugnyiwl0yzy00smyidmtqw.jpeg", "Whisk_xity1ezyizmyirwztqtn0ktl5qtz00cm3itytmm.jpeg", "Whisk_xiwnzymn1ymzhr2ntimnxgtllrdn00yn0mjytqw.jpeg",
  "Whisk_xkdmzqtmldtzmzgztgjylltljztn00cmhzmzted.jpeg", "Whisk_xm2nirtn5utozkjmtidn2iwl2iwy00yn1ytntqz.jpeg", "Whisk_xqwmlrwoygtyzgzytyzyjltllj2n00yy5ajytit.jpeg",
  "Whisk_xqwokr2m5gdzxkdntyzy2iwljbdm00imkjwntet.jpeg", "Whisk_xu2mmbjz0qmzykzntktzjfwl1czy00sy0ujztuz.jpeg", "Whisk_xuwmkbty2kjmizgntkzm2gtl4mto00iz4ajytmd.jpeg",
  "Whisk_xuzn1etnymjzjfdntmgmifwlkvmz00izibjmtaj.jpeg", "Whisk_xytowkznjlzykvjztu2m1iwl1qzy00yymzjytid.jpeg", "Whisk_yatywytyjrznmrwntimy1ewlye2y00cn3cdotat.jpeg",
  "Whisk_ye2nkv2nkv2mknzytgdnkjwlxugo00inhfmytgz.jpeg", "Whisk_ygdmkzjz5qwomvjntegzxgtl4ktn00so0izntmz.jpeg", "Whisk_ygtm3cdmln2yxqmntetykfwlwm2y00inxktntyg.jpeg",
  "Whisk_ygtz3ewzyygm4ctztigz0iwlzctm00soirgmty2.jpeg", "Whisk_yityxuwm4ijz1ummtktoifwl2ktn00czlv2mtmm.jpeg", "Whisk_yiwz0ugzzctoyijytegoiltl5yjm00inmrdmtqd.jpeg",
  "Whisk_yktoxego2aty5gjmtqgnkjwljfgn00sn3ajmtem.jpeg", "Whisk_ykzmxuzn5qgz2czytezmkfwlyemy00inzudotaz.jpeg", "Whisk_ymgn5kzymjtzzqmntutylfwlzygo00colfmztym.jpeg",
  "Whisk_yqgnxugo2mdmhr2ntmgnjjwlmrgo00sykz2mtcj.jpeg", "Whisk_yugnzkdmkrzn0uwztctn1iwlirmn00ymzemztqm.jpeg", "Whisk_yuwnmzgmljwojnzmtqmnziwlykjm00sylrwntew.jpeg",
  "Whisk_yuzn0ywy3m2m3emztq2ylfwljjmy00cmhrjntgd.jpeg", "Whisk_yy2yymgnijzmhzdmtywnlfwlwgzn00syyatztct.jpeg", "Whisk_yyjm0ijy5y2mkvmztgdzjhtlwugz00izhbzmtad.jpeg",
  "Whisk_ze2m4mjn5itm5ujntyzn3ktlycjy00soyemntcz.jpeg", "Whisk_zegoljzm2mdo2ewmti2y5ewlkzmz00cnhr2yti2.jpeg", "Whisk_zezn0ajn4kto3ewmtuwnwgtl2utn00imlftmtyg.jpeg",
  "Whisk_zidz3cjm0qwoinzytitz5ewl5imz00coihdmtqz.jpeg", "Whisk_zignmdzm2itzjnmztazy2ewl3cdz00sm3utztgz.jpeg", "Whisk_zigz5gty3qtz0mwntetz0ktlwudz00cz2ajytqg.jpeg",
  "Whisk_zimmmzwnmrdo3edmtkzy1ewlkvjm00co1ktmtug.jpeg", "Whisk_zktm2kdowi2y0ijytujm0iwlyydn00yn5egmtym.jpeg", "Whisk_zmmm1uzmwqmnihzmtetz2iwlmrdn00iy3ijmtim.jpeg",
  "Whisk_zqwyifdnxajy2e2mtijzhfwlwqjz00smkfdotcd.jpeg", "Whisk_zummxgjn1ezm5gdmtqwmzewljrgm00so5qdztyz.jpeg", "Whisk_zuwo4ijzkljmzitntitn1ktlkf2m00cn4ujytm2.jpeg",
  "Whisk_zy2ykljz3mwzlrdztkdohfwl3kjy00iy2itytyd.jpeg", "Whisk_zyjyirwnhzjnkz2mtuwmkjwl1qdm00iylrtytkt.jpeg"
];

export const modelsData: Model[] = [
  {
    slug: 'alexandara-white',
    name: 'Alexandara White',
    avatar: '/Stock Photos/Alexandara White/modelpage/1.jpeg',
    coverImage: '/Stock Photos/Alexandara White/modelpage/1.jpeg',
    categories: ['Editorial', 'Runway'],
    location: 'London',
    height: "178cm / 5'10\"",
    measurements: "82-60-88",
    hairColor: 'Blonde',
    eyeColor: 'Blue',
    bio: 'Alexandara is a versatile model with a strong editorial presence.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Alexandara White', alexandaraFiles),
    cardImages: [
      '/Stock Photos/Alexandara White/modelpage/1.jpeg',
      '/Stock Photos/Alexandara White/modelpage/2.jpeg',
      '/Stock Photos/Alexandara White/modelpage/3.jpeg',
      '/Stock Photos/Alexandara White/modelpage/4.jpeg',
      '/Stock Photos/Alexandara White/modelpage/5.jpeg'
    ]
  },
  {
    slug: 'kyla-gabriel',
    name: 'Kyla Gabriel',
    avatar: '/Stock Photos/Kyla Gabriel/modelpage/1.jpeg',
    coverImage: '/Stock Photos/Kyla Gabriel/modelpage/1.jpeg',
    categories: ['Commercial', 'Beauty'],
    location: 'New York',
    height: "175cm / 5'9\"",
    measurements: "84-62-90",
    hairColor: 'Brunette',
    eyeColor: 'Brown',
    bio: 'Kyla is known for her commercial appeal.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Kyla Gabriel', kylaFiles),
    cardImages: [
      '/Stock Photos/Kyla Gabriel/modelpage/1.jpeg',
      '/Stock Photos/Kyla Gabriel/modelpage/2.jpeg',
      '/Stock Photos/Kyla Gabriel/modelpage/3.jpeg',
      '/Stock Photos/Kyla Gabriel/modelpage/4.jpeg',
      '/Stock Photos/Kyla Gabriel/modelpage/5.jpeg'
    ]
  },
  {
    slug: 'pamela-nelson',
    name: 'Pamela Nelson',
    avatar: '/Stock Photos/Pamela Nelson/modelpage/1.jpeg',
    coverImage: '/Stock Photos/Pamela Nelson/modelpage/1.jpeg',
    categories: ['Editorial', 'Commercial'],
    location: 'Paris',
    height: "180cm / 5'11\"",
    measurements: "86-63-92",
    hairColor: 'Dark Brown',
    eyeColor: 'Green',
    bio: 'Pamela is a high-fashion icon.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Pamela Nelson', pamelaFiles),
    cardImages: [
      '/Stock Photos/Pamela Nelson/modelpage/1.jpeg',
      '/Stock Photos/Pamela Nelson/modelpage/2.jpeg',
      '/Stock Photos/Pamela Nelson/modelpage/3.jpeg',
      '/Stock Photos/Pamela Nelson/modelpage/4.jpeg',
      '/Stock Photos/Pamela Nelson/modelpage/5.jpeg'
    ]
  },
  {
    slug: 'victoria-james',
    name: 'Victoria James',
    avatar: '/Stock Photos/Victoria James/model_page/1.png',
    coverImage: '/Stock Photos/Victoria James/model_page/1.png',
    categories: ['Editorial', 'Runway'],
    location: 'Tokyo',
    height: "179cm / 5'10\"",
    measurements: "81-59-87",
    hairColor: 'Red',
    eyeColor: 'Blue',
    bio: 'Victoria brings a unique, striking look.',
    availability: 'Available',
    highlights: [],
    posts: generateGroupedPosts('Victoria James', victoriaFiles),
    cardImages: [
      '/Stock Photos/Victoria James/model_page/1.png',
      '/Stock Photos/Victoria James/model_page/2.png',
      '/Stock Photos/Victoria James/model_page/3.png',
      '/Stock Photos/Victoria James/model_page/4.png',
      '/Stock Photos/Victoria James/model_page/5.jpeg'
    ]
  }
];
