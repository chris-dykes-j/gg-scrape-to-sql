const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

console.log(`Heaven or Hell.`);

// There is definitely a better way, but this works.
const character_links = [
	"https://dustloop.com/wiki/index.php?title=GGST/Ramlethal_Valentine/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Sol_Badguy/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Jack-O/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Nagoriyuki/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Millia_Rage/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Chipp_Zanuff/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Ky_Kiske/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/May/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Zato-1/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/I-No/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Happy_Chaos/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Baiken/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Anji_Mito/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Leo_Whitefang/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Faust/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Axl_Low/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Potemkin/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Giovanna/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Goldlewis_Dickinson/Frame_Data",
	"https://dustloop.com/wiki/index.php?title=GGST/Testament/Frame_Data"
];

// ID variables for SQL.
let character_id = 1;
let move_id = 1;

character_links.forEach(link => {
	axios.get(link)
		.then(res => {
			const HTML = res.data;
			const $ = cheerio.load(HTML);
			const character_name = link.replace("https://dustloop.com/wiki/index.php?title=GGST/", "")
				.replace("/Frame_Data", "");

			// Taking table rows, extracting cells; regex to deal with whitespace from HTML.
			const temporary = [];
			const move_data = [];
			$(".cargoDynamicTable tr", HTML).each((_, element) => {
				const attack = $(element).text()
					.replace(/ +/g, "_")
					.replace(/\s+/g, " ")
					.replace("'", "''")
					.substring(1);
				if (!attack.startsWith("input") && !attack.startsWith("name")) { temporary.push(attack) };
			});
			temporary.forEach(entry => {
				const attack = entry.split(" ");
				move_data.push(attack);
			});

			let SQL_INSERT = `INSERT INTO characters VALUES (${character_id}, `
				+ `'${character_name.replace("_", " ")}');\n\n`;

			// Formats all attack data for SQL file.
			move_data.forEach(attack => {
				m = format_data(attack);
				SQL_INSERT += `INSERT INTO move_list VALUES (${move_id}, ${character_id}, '${m.input}', `
					+ `'${m.move_name}', '${m.damage}',	'${m.guard}', '${m.startup}', '${m.active}', '${m.recovery_frames}', '${m.on_block}');\n`;
				move_id++;
			});
			character_id++;

			fs.writeFile(`./sql/${character_name.toLowerCase()}.sql`, SQL_INSERT, error => {
				if (error) { console.log(error); return; }
				else { console.log(character_name.replace("_", " ")); }
			});
		})
		.catch(error => {
			console.error(error);
		})
});

// Function for formatting attack data.
// It could be prettier, but it's ok.
function format_data(attack) {
	let input = attack[0];
	let move_name, damage, guard, startup, active, recovery_frames, on_block;
	if (attack[0].includes("Throw")) {
		move_name = attack[0];
		damage = attack[1];
		guard = attack[2];
		startup = attack[3];
		active = attack[4];
		recovery_frames = attack[5];
		on_block = "NULL";
	} else {
		if (attack[1].match(/^\d/)) {
			move_name = attack[0];
			damage = attack[1];
			guard = attack[2];
			startup = attack[3];
			active = attack[4];
			recovery_frames = attack[5];
			on_block = attack[6]
		} else {
			move_name = attack[1];
			damage = attack[2];
			guard = attack[3];
			startup = attack[4];
			active = attack[5];
			recovery_frames = attack[6];
			on_block = attack[7]
		}
	}
	const attack_object = {
		input, move_name, damage, guard, startup, active, recovery_frames, on_block
	};
	return attack_object;
}