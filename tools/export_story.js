const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const start = source.indexOf('const chapters =');
const end = source.indexOf('\n\nconst state=', start);
if (start < 0 || end < 0) throw new Error('无法从 game.js 提取 chapters');
const expression = source.slice(start, end).replace(/^const chapters\s*=\s*/, '').replace(/;\s*$/, '');
const chapters = vm.runInNewContext(expression);

const music = ['A New Day（清晨希望）','peacefull ville（校园日常）','peacefull ville（校园日常）','peacefull ville（运动会）','Morning rain（雨天）','Apple Cider（文化节）','Apple Cider（新年灯火）','A New Day（初雪清晨）','peacefull ville（城市出行）','Morning rain（春雨心事）','JRPG2 Piano（星空告白）'];
const looks = ['校服：常态 / 惊喜','校服：常态 / 嗔怒 / 惊喜','校服：常态 / 害羞','运动应援装：举手欢呼','校服：安静心事 / 害羞','文化节精心打扮装：提星灯','文化节精心打扮装：提星灯','冬季日常装：递热饮','周末出行装：拿相机回望','校服：嗔怒 / 担忧 / 害羞','校服：害羞'];
const out = [];
out.push('# 《常中星下，与你相遇》剧情纯文字审核版');
out.push('');
out.push('> 审核说明：以下内容由游戏脚本自动导出，包含全部旁白、对白、选择和对应分支回应。修改意见可直接写“第X章 + 台词关键词”。');
out.push('');
out.push('## 人物与系统');
out.push('');
out.push('- 男主：萧楚南，高一新生。');
out.push('- 女主：熊莉。外观参考网络创作者“兔娘”的公开形象，校内经历与恋爱故事均为虚构。');
out.push('- 关系数值：心动、信赖、默契。首次关键选择后显示，所有路线均通向纯甜结局。');
out.push('- 对话颜色：熊莉樱粉、萧楚南澄蓝、旁白暖金、班长/同学青绿、系统紫色。');
out.push('');

chapters.forEach((chapter, index) => {
  out.push(`## ${chapter.title}`);
  out.push('');
  out.push(`场景：${chapter.place}｜${chapter.sub}`);
  out.push(`配乐：${music[index]}`);
  out.push(`熊莉造型：${looks[index]}`);
  out.push('');
  chapter.lines.forEach((item) => {
    if (Array.isArray(item)) {
      out.push(`${item[0]}：${item[1]}`);
      out.push('');
      return;
    }
    out.push('【关键选择】');
    item.choice.forEach((choice, i) => {
      out.push(`${i + 1}. ${choice}`);
      out.push(`   熊莉回应：${item.reply[i]}`);
    });
    out.push('');
  });
});

out.push('---');
out.push('导出来源：game.js；重新运行 `node tools/export_story.js` 可在剧情更新后同步此审核稿。');
fs.writeFileSync(path.join(root, '剧情纯文字审核版.md'), out.join('\r\n'), 'utf8');
console.log(`已导出 ${chapters.length} 章，${out.length} 行。`);
