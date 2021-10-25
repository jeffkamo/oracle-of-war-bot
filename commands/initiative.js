
/* Example initiative round...

# Pre session player setup
(P1) !i register Koru
(P2) !i register Yuki
(P3) !i register Tomo

# Pre session npc setup
(GM) !i npc Ako insight:2 reflexes:3 earth:2
(GM) !i npc Boko ins:2 ref:2 ear:3
(GM) !i npc Chika ins:2 ref:1 ear:4
(GM) !i npc Denzo ins:2 ref:4 ear:1

# Combat setup
(GM) !i start
(GM) !i add Ako Boko Chika Denzo
(P1) !i 10
(P2) !i 30 attack
(P3) !i 20
(GM) !i
(Oracle) Initiative order:

```
30  |a|  Yuki
21  | |  Boko
25  | |  Chika
20  | |  Tomo
12  | |  Denzo
10  | |  Koru
05  | |  Ako
```

*** Declare your stances! ***

(P1) !i stance fire
(P3) !i stance air
(GM) !i stance Ako earth
(GM) !i stance Boko defense
(GM) !i stance Chika fulldefense
(GM) !i stance Denzo center
(GM) !i
(Oracle) Initiative order:

```
30  |a|  Yuki
21  |d|  Boko
25  |D|  Chika
20  |d|  Tomo
12  |C|  Denzo
10  |A|  Koru
05  |D|  Ako
```

(GM) !i w boko 10
(GM) !i w chika 20
(GM) !i w denzo 30
(GM) !i w ako 40
(GM) !i
(Oracle) Initiative order:

```
30  |a|  Yuki
21  |d|  Boko [nicked]
25  |D|  Chika [hurt]
20  |d|  Tomo
12  |C|  Denzo [crippled]
10  |A|  Koru
05  |D|  Ako [OUT]
```

*/

// const Database = require("@replit/database");
// const db = new Database();

// const store = {
//   pc_register: [
//     {
//       name: "Koru",
//       user_id: '415445152258326540',
//     }
//   ],
//   npc_register: [
//     {
//       id: 'ako',
//       insight: 1,
//       reflexes: 1,
//       earth: 1,
//     }
//   ],
//   participants: [
//     {
//       type: 1, // pc
//       register_id: '415445152258326540',
//       initiative: 1,
//     },
//     {
//       type: 0, // npc
//       register_id: 'ako',
//       initiative: 3,
//       wounds: 0,
//     },
//   ],
// }


const store = {
  pc_register: [],
  npc_register: [],
  participants: [],
};


/**
 * Stances
 */

const STANCES =  [
  'A',           'a',      'c',      'd',       'D',
  'f',           'w',      'v',      'a',       'e',
  'fire',        'water',  'void',   'air',     'earth',
  'full-attack', 'attack', 'center', 'defense', 'full-defense',
  'full-att',    null,     null,     null,      'full-def',
  'f-att',       null,     null,     null,      'f-def',
  'fatt',        'att',    'cen',    'def',     'fdef',
  'f.att',       null,     null,     null,      'f.def',
  'full.att',    null,     null,     null,      'full.def',
  'full.attack', null,     null,     null,      'full.defense',
];

const getStanceSymbol = (stance_text) => {
  const stanceId = STANCES.indexOf(stance_text) % 5;
  return STANCES[stanceId];
};


/**
 * addNPCInitiative
 *
 * add list of registered NPCs to the initiative
 */

const addNPCInitiative = (msg, params) => {
  const missing = [];
  const dupes = [];

  params.forEach(npc_name => {
    const existing_npc = store.npc_register.find(npc => npc.id === npc_name);
    const existing_participant = store.participants.find(npc => npc.register_id === npc_name);

    if (existing_participant) {
      dupes.push(npc_name);
    } else if (existing_npc) {
      store.participants.push({
        type: 0,
        register_id: npc_name,
        name: npc_name,
        initiative: 1, // to be replaced with dice roll
        stance: null,
      });
    } else {
      missing.push(npc_name);
    }
  });

  let response = '';

  if (missing.length > 0) {
    response += `These NPCs have not been registered: ${missing.join(', ')}`;
  }

  if (dupes.length > 0) {
    response += `These NPCs already exist in the initiative: ${dupes.join(', ')}`;
  }

  if (response.length > 0) msg.reply(response);
};


/**
 * addPCInitiative
 *
 * add a PC to the initiative order
 */

const addPCInitiative = (msg, initiative) => {
  const user_id = msg.author.id;
  const existing_participant = store.participants.find(p =>
    p.type === 1 && p.register_id === user_id
  )
  const existing_pc = store.pc_register.find(pc => pc.user_id === user_id);

  if (existing_participant) {
    existing_participant.initiative = initiative;
  } else if (existing_pc) {
    store.participants.push({
      type: 1,
      register_id: user_id,
      name: existing_pc.name,
      initiative: initiative,
      stance: null,
    });
  } else {
    msg.reply(`you don't have a character yet. Use '!i register your_name' to add your character.`);
  }
};


/**
 * registerPC
 *
 * register a player as a character
 */

const registerPC = (msg, params) => {
  const user_id = msg.author.id;
  const [name] = params;
  const existing_pc = store.pc_register.find(pc => pc.user_id === user_id);

  if (existing_pc) {
    existing_pc.name = name;
    msg.reply(`Your character name is now "${name}"`);
  } else {
    store.pc_register.push({name, user_id});
    msg.reply(`Your character has been added as "${name}"`);
  }
};


/**
 * addNPC
 *
 * registers an NPC as... an npc
 * 
 * @params
 * - id (string): name of the npc
 * - attributes (array[string]): list of traits in the from
 *   of "traitName:value". Ex. ["earth:2", "insight:1"]. Valid
 *   values: insight, earth, reflexes
 */

const registerNPC = (msg, params) => {
  let [id, ...attributes] = params;
  const existing_npc = store.npc_register.find(npc => npc.id === id);

  if (attributes) {
    attributes = attributes
      .map(attr => attr.split(':'))
      .reduce((acc, [key, value]) => ({ [key]: value, ...acc }), {})
  }

  if (existing_npc) {
    existing_npc.id = id;
    existing_npc.insight = attributes.insight || 1;
    existing_npc.reflexes = attributes.reflexes || 1;
    existing_npc.earth = attributes.earth || 1;
    msg.reply(`"${id}" has been updated`);
  } else {
    store.npc_register.push({
      id,
      insight: attributes.insight || 1,
      reflexes: attributes.reflexes || 1,
      earth: attributes.earth || 1,
    });
    msg.reply(`NPC added as "${id}"`);
  }
};


/**
 * addStance
 *
 * set an npc or character stance
 */

const addStance = (msg, params) => {
  let id;
  let stance;

  if (params.length === 1) {
    id = msg.author.id;
    ([stance] = params);
  } else if (params.length === 2) {
    ([id, stance] = params);
  } else if (params.length >= 3) {
    msg.reply('too many parameters for setting stance.');
    return;
  } else {
    msg.reply('too few parameters for setting stance.');
    return;
  }

  const pc_participant = store.participants.find(p => p.register_id === id);
  const npc_participant = store.participants.find(p => p.register_id === id);
  stance = getStanceSymbol(stance);

  if (pc_participant) {
    pc_participant.stance = stance
  } else if (npc_participant) {
    npc_participant.stance = stance
  } else {
    msg.reply("your character was not found, or is another player's PC. Have you set its initiative?");
  }
};


/**
 * showInitiative
 *
 * report the current initiative
 */

const showInitiative = (msg) => {
  console.log(store);

  if (store.participants.length === 0) {
    msg.channel.send("The iniative order is empty.");
    return;
  }

  let response = "";

  response += "```";
  response += "===\n";

  response += store.participants
    .sort((a, b) => b.initiative - a.initiative) // reverse numerical order
    .map((p) => {
      const init = `${p.initiative}`.padStart(2, '0');
      const stance = p.stance || ' ';
      return `${init}  |${stance}|  ${p.name}`;
    })
    .join('\n');

  response += "\n===\n";
  response += "```";

  msg.channel.send(response);
};


/**
 * Final export!
 */

module.exports = {
  name: "init",
  alias: ["i"],
  description: "A command for managing combat initiative",
  execute(msg, [subcommand, ...params]) {
    console.log('test');

    // subcommand as a number is reserved for setting player initiative
    const initiative_number = parseInt(subcommand);
    const is_number = !isNaN(initiative_number);
    if (is_number) {
      addPCInitiative(msg, initiative_number);
      return;
    }

    switch(subcommand) {
      case "start":
        // flush existing initiative
        break;
      case "add":
        addNPCInitiative(msg, params)
        break;
      case "npc":
        registerNPC(msg, params);
        break;
      case "register":
        registerPC(msg, params);
        break;
      case "stance":
        addStance(msg, params)
        break;
      case "wounds":
      case "w":
        // add or remove damage from an npc
        break;
      case "":
      case undefined:
      case null:
        showInitiative(msg);
    }
  }
};
