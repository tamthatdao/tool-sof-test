export function executeCustomMappingByTemplateTypePassbook(pages_content, table_option: any = {}, selfParent: MappingService) {
  // window['Passbook'] = pages_content;
  let keyConditions = table_option.keyConditions || [];
  function PUtils() {
    let self = this;
    self.production = true;
    self.writeTable = (data, skip = false) => {
      if (self.production) {
        return;
      }
      let w = data.map(line => {
        try {
          let v = (line || []).map(col => (col.desc || ''));
          // self.debug(v)
          return v;
        } catch (error) {
          self.debug("ERROR:", line)
        }
      })
      console.table(w)
    }
    self.debug = (...message) => {
      return !self.production ? console.log(...message) : null;
    }
    self.writeLine = (list, fileds = ['desc', 'upLeftX', 'upLeftY', 'bottomRightX', 'bottomRightY', 'width', 'height']) => {
      if (self.production) {
        return;
      }
      let w = list.map(row => fileds.reduce((n, o) => {
        n[o] = (row || {})[o] || null;
        return n;
      }, {}));
      console.table(w)
    }
    self.regex_date = {
      list: [
        new RegExp("([0-9]{1,2})([-.・ー]{1,2}\\s*)([0-9]{1,2})([-.・ー]{1,2}\\s*)([0-9]{1,2})", "g"),
        new RegExp("([0-9a-z]{1,2})([-.・ー\\s]{1,2})([0-9a-z]{1,2})([-.・ー\\s]{1,2})([0-9a-z]{1,2})", "g"),
        new RegExp("([0-9a-z]{1,2})([-.・ー\\*]{1,2})([0-9a-z]{1,2})([-.・ー\\*]{1,2})([0-9a-z]{1,2})", "g"),
        new RegExp("[a-z0-9]{1,2}[m\\s\\*\\・\\ッ\\,\\:\\.\\-\\/\\ー]{1,2}[a-z0-9]{1,2}[m\\s\\*\\・\\ッ\\,\\:\\.\\-\\/\\ー]{1,2}[a-z0-9]{1,2}", "g"),
        new RegExp("\\b\\d{4}\\/\\d{1,2}\\/\\d{1,2}\\b", "g"),
        new RegExp("^\\d{4,}((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))\\*$", "g")
      ],
      match: (desc) => self.regex_date.list.findIndex((regex) => new RegExp(regex).test(desc.toString() || '')),
      split: (desc) => {
        // self.debug("self.regex_date:split:case:other", desc);
        let index = self.regex_date.match(desc);
        if (index > -1) {
          if( new RegExp(self.regex_date.list[4]).test(desc.toString() || "")){
            index = 4;
          }
          let match = (desc.toString() || '').match(new RegExp(self.regex_date.list[index])) || [];
          // self.debug("self.regex_date:split", index, match);
          if (match.length > 0) {
            let current = match[0].replace(/\s+/g, '');
            let text = (desc || '').slice(desc.indexOf(match[0]) + (match[0] || '').toString().length);
            return [null, current, text];
          }
        }
        let value_date = ((desc || '').match(new RegExp("[m\\s\\*・ッ,:.\\-\\/ー=\\d]", "g")) || []).join("");
        if (value_date.length > 0 && (value_date.match(new RegExp(/[\d]/g)) || []).length === 6) {
          value_date = (value_date.match(new RegExp(/[\d]/g)) || []).join("");
          desc = `${value_date.slice(0, 2)}-${value_date.slice(2, 4)}-${value_date.slice(4, 6)}`;
          return [null, desc, null]
        }
        if (value_date.length >= 6) {
          desc = `${value_date.slice(0, 2)}-${value_date.slice(2, 4)}-${value_date.slice(4, 6)}`;
          // self.debug("self.regex_date:split:value_date", desc);
        } else {
          // self.debug("self.regex_date:split:case:other", desc);
        }
        return [null, desc, null]
      },
      verify: (date) => {
        let ex = date.toString().split("-");
        if (ex.length === 3) {
          return ex[1] && Number(ex[1]) <= 12 ? true : false;
        }
        ex = date.toString().split(".");
        if (ex.length === 3) {
          return ex[1] && Number(ex[1]) <= 12 ? true : false;
        }
        return true;
      },
      is_date: (desc) => {
        if (!desc) {
          return true;
        }
        desc = `${desc || ''}`.toString().trim();
        let text_length = (desc.match(/([\Wa-zA-Z])/g) || []).length;
        let num_length = (desc.match(/[\d]+/g) || []).length;
        return text_length > num_length + 2;
      }
    }
    self.in_number_list = (number_list, cell) => {
      return true;
    }
    self.remove_characters_noide = (desc) => {
      let characters = ['★', '*'];
      return `${desc || ''}`.split("").reduce((n, o) => !characters.includes(o) ? n = `${n}${o}` : n, '')
    }
    self.regex_price = {
      list: [
        new RegExp("[*¥]+[0-9,]+", "g"),
        new RegExp("[*¥・]+[0-9,]+", "g"),
        new RegExp("[*・¥ッ,0-9]+", "g"),
        new RegExp("[\\s*・¥ッ,0-9]+", "g"),
        new RegExp("[\\s*・¥ッ★,0-9]+", "g"),
        new RegExp("[\\s*・¥ッ★,.0-9]+", "g")
    ],
      text_match: ["*", "・", "¥", "ッ", "★", ",", ".","-"],
      match: (desc) => self.regex_price.list.findIndex((regex) => {
        if (new RegExp(regex).test(desc.toString() || '')) {
          let match = (desc.toString() || '').match(new RegExp(regex)) || [];
          return match.length > 0 && match.some(v => v.trim().length > 0 && ((v || '').match(new RegExp(/\d/g)) || []).join("").length > 0)
        }
        return false
      }),
      split: (desc) => {
        desc = (desc || '').toString().split(" ").join("");
        let index = self.regex_price.match(desc);
        if (index > -1) {
          let { match } = desc.split("").reduce((n, o) => {
            if (n.status === 2 && n.match.length === 1 && self.regex_price.text_match.includes(n.match)) {
              n.match = "";
              n.status = 0;
            }
            if (n.status !== 2 && (new RegExp(/[0-9]/g).test(o) || self.regex_price.text_match.includes(o))) {
              n.status === 0 ? n.status = 1 : null;
              n.match = `${n.match}${o}`;
            } else if (n.status === 1) {
              n.status = 2;
            }
            return n;
          }, { match: '', status: 0 });
          if (match.length > 0) {
            let index = desc.indexOf(match);
            let first = (desc || '').slice(0, index);
            let last = (desc || '').slice(index + (match || '').toString().length);
            return [first, match, last];
          }
        }
        return [desc, null, null]
      },
      is_number: (desc) => {
        if (!desc) {
          return false;
        }
        desc = (desc || '').toString();
        if (desc.includes("***")) {
          return false;
        }
        const countLength = () => desc.split("").reduce((n, o) => self.regex_price.text_match.includes(o) || (new RegExp(/[0-9]/g).test(o)) ? n = n + 1 : n, 0);
        if (desc.length === countLength()) {
          return true;
        }
        return false;
      },
      remove_last: (desc) => {
        if (!["*", "★", "¥"].some(v => `${desc}`.startsWith(v))) {
          return desc
        }
        let _first = `${desc}`.slice(0, 1)
        let lcount = `${desc}`.length
        desc = self.remove_characters_noide(desc)
        let fcount = `${desc}`.length
        const ll = `${desc}`.split(",")
        if (ll.length > 1) {
          let vindex = ll[ll.length - 1].split("").findIndex(v => new RegExp(/[\d]/).test(v))
          ll[ll.length - 1] = ll[ll.length - 1].slice(0, 3 + vindex)
          return `${self.map_to_number(ll.join(","))}`
        }

        const { status, new_desc } = ll.reduce((n, o, i) => {
          if (!n.status) {
            if (i === 0) {
              n.new_desc.push(o)
            } else if (o.length === 3) {
              n.new_desc.push(o)
            } else {
              n.status = true;
              let index = o.split("").findIndex(v => new RegExp(/[\d]/).test(v))
              n.new_desc.push(o.slice(0, 3 + index))
            }
          }
          return n;
        }, { status: false, new_desc: [] })
        return `${self.map_to_number(new_desc.join(","))}`
      }
    }
    self.columns = {
      removes: ['記号'],
      date: { list: ['年月日', '年月', '日付', '年・月・日', '年・月日', '月日', '年日', '年・・日', '差日記', '年井日就号', '対月号'], index: 0, lable: `年月日`, field: 'date' },
      description: { list: ['摘要', '備考', 'お客様メモ', 'お取引内容', '白要', '記号', '渡要を基場・モ', '消衰お室号・モ', '有要', 'お度', '会る実メモ', '控要お客域メモ', '揮要:る振メモ', '消要お客標メモ', '渡要を宮標人', '消要お芸ーメ', '要を室域メモ', '特要を室理メニ', '取扱店', 'お預みは', '波日', '振長お客様メ三', 'お要お様メモ', '振要『客メモ', '冷お慣モ', '演手お客号メモ', '株票お客メミ', '振害お客メモ', '通要年入モ', 'お刻お客場入モ', '振要おを号」日', '年要お客場メモ', '振装', '振業をを刻メ日', '振要お境メ三', '旧要', '摘関', '調要', '払番う残六日', '営合日', '現要', '指要', '広号', '広以', '埼基', 'お預分手', '摘麦お客帳メモ', '損長お客ほメモ', '客様メモ', '会だ様人モ', '手熙お客帳メモ', '振お客様ぶモ', '摘要お客様メヨ'], index: 1, lable: '摘要', field: 'description' },
      payment: { list: ['お支払金額', 'お支払金 額', 'お支払金張', 'お文払金額', 'お支払額', 'お支払い金額', 'お引出し金額', 'お引き出し金額', 'シ支金額', 'シ天社金額', 'お支金額', 'お払戻金額', 'お支払全額', 'お出し金額', '指出し類', 'お引出し支関', 'おり出し金額', 'お引に出し金額', 'お支社金額', '土金額', '支土金額', '問は払金額', 'お支払全庫', 'おチ金年', 'お支払金類', 'お沢三金庫', ':当番号', 'お支預金額', 'お支払番額', 'お支払金高', 'お支払円', 'お支払手額', '問き払金額', 'お支払金額特', 'お支払金額中', '小手払金額', 'お金場金額', '生戻ル金額', '要市払戻し金額', 'お支払金額別', 'お支払金額借', 'お支払金額', '社名校金'], index: 2, lable: 'お支払金額', field: 'payment' },
      deposit: { list: ['お預り金額', '貝ワ立額コ', 'お預金額', 'お預入れ金額', 'れ金額', 'お預かり金額', 'お預かり金額日', '五預り金額', 'お項全額', 'お預リ金額', 'お預り全額', '帳金額', '特金', 'お特金額', 'お部番', 'お預がる金額料', 'お番金', '掛込金額', 'お預金預', 'おり金産', '年支', 'お預かわ金額場', 'お金額」', 'お取なり金額', 'お預かる金額', 'お預かも金額預', 'お預り金郎', 'お預り金納', '診部引番', '新球け', 'お預るは後額手', 'お預類', 'る預材金華', 'お預るる金額中料', 'お預かい金額', 'お泉かも金額刻', 'お預なり金額', 'お預るわ金額'], index: 3, lable: 'お預り金額', field: 'deposit' },
      balance: { list: ['差引残高', '差号残高', 'お預け入れ残高', '残高', '差手引残番', '残特', '差し引き残高', 'お類け入れ残', '等眼液番', 'お預は入れ残高', '現在高', 'お預り高', '差引残番', '差手残室', '差引残等', '月会残日', '現高', '差引残商', 'お預け入れ備日', '引残日', '日時高', '第引手', '差引場高円', '差引高', '差地', '差引残', '月式残', '差期残高掃', '院格羽', '差引残高類', '差外残年代日', '月支年日', '三言残料', '差引渡満', '引残高借', '差引残高書', '差引残高円', '変天残高'], index: 4, lable: '差引残高', field: 'balance' },
      find: (desc, columns = null) => {
        if (!desc || (desc && desc.toString().trim().length === 0)) {
          return;
        }
        desc = desc.toString().trim();
        columns = columns || [self.columns.date, self.columns.description, self.columns.payment, self.columns.deposit, self.columns.balance];
        let index = columns.findIndex(cell => cell.lable === desc);
        if (index > -1) {
          return columns[index];
        }
        index = columns.findIndex(cell => cell.list.some(v => v === desc));
        if (index > -1) {
          return columns[index];
        }
        return columns.find(cell => cell.list.some(v => v.includes(desc) || desc.includes(v)))
      },
      get: () => {
        return [self.columns.date, self.columns.description, self.columns.payment, self.columns.deposit, self.columns.balance].map(({ lable }) => lable);
      },
      get_max_text_column: (columns = null) => {
        columns = columns || [self.columns.date, self.columns.description, self.columns.payment, self.columns.deposit, self.columns.balance];
        return columns.map(({ list, lable }) => [...list, lable].reduce((n, o) => !n ? n = o : (n.length > o.length ? n : n = o), null))
      },
      get_lable_by_index: (index) => {
        const { lable } = [self.columns.date, self.columns.description, self.columns.payment, self.columns.deposit, self.columns.balance][index] || { lable: '' };
        return lable;
      },
      match: (desc_line, columns) => {
        columns = columns || [self.columns.date, self.columns.description, self.columns.payment, self.columns.deposit, self.columns.balance];
        const headers = columns.reduce((n, { list }) => n = [...n, ...list], []);
        return desc_line.join("").match(new RegExp(`(${headers.join("|")})`, "g")) || [];
      },
      in_column:(desc) => {
        const  columns = [
          ...self.columns.date.list,
          ...self.columns.description.list,
          ...self.columns.payment.list,
          ...self.columns.deposit.list,
          ...self.columns.balance.list,
        ];
        return columns.includes(desc.toString())
      }
    }
    self.replate_dot_of_number = (desc) => {
      if (!self.regex_price.is_number(desc)) {
        return desc;
      }
      let tmp = desc.toString();
      if (tmp.includes(".")) {
        desc = tmp.split(".").join(",");
        self.debug("self.replate_dot_of_number:", tmp, desc);
      }
      // tmp = desc.toString();
      // if (desc.includes("・")) {
      //     self.debug("self.replate_dot_of_number:", tmp);
      //     desc = desc.split("・").join(",");
      // }
      return desc;
    }
    self.convert_to_number = (desc) => {
      const val = Number(
        (
          (desc || "")
            .toString()
            .split(" ")
            .join("")
            .toString()
            .match(new RegExp(/\d/g)) || []
        ).join("")
      );
      if (desc && desc.toString().startsWith('-')) {
        return val * -1;
      }
      return val;
    };
    self.map_to_number = (desc) => {
      const split_last_number = (val) => {
        val = val.toString();
        if (self.regex_price.text_match.includes(val.slice(-1))) {
          return val.slice(0, -1);
        } else {
          return val;
        }
      }
      desc = (desc || "").toString();
      if (desc.indexOf(",") > -1) {
        return split_last_number(desc);
      }
      desc = self.convert_to_number(desc);
      let v = desc.toString().split("").reverse();
      v = v.reduce((n, o, i) => {
        let a = n.length - 1;
        if (i % 3 === 0) {
          n.push(o);
        } else if (i === 0) {
          n.push(o);
        } else if (i === v.length - 1) {
          n[a] = `${o}${n[a]}`;
        }
        else {
          n[a] = `${o}${n[a]}`;
        }
        return n;
      }, []);
      return v.reverse().join(",");
    }
    self.detect_no_line_price = (desc) => {
      // ***********常***
      if (['回目', "月"].some(val => `${desc}`.endsWith(val))) {
        return false;
      }
      if (desc && (desc.match(/[0-9]/g) || []).length === 0 && (desc.match(/[\*]/g) || []).length > desc.length / 2) {
        return true;
      }
      // if (desc && (desc.match(/[\*]+[\d\,]+/g) || []).length > 0) {
      //     desc = (desc.match(/[\*]+[\d\,]+/g) || []).join("");
      //     if (desc && (desc.match(/[0-9]/g) || []).length === 0 && (desc.match(/[\*]/g) || []).length > desc.length / 2) {
      //         return true;
      //     }
      // }
      return false;
    }
    self.in_distance = (first, last) => {
      if (!first || (first && !first.upLeftX)) {
        return false;
      }
      if (!last || (last && !last.upLeftX)) {
        return false;
      }
      let first_left_skip = first.upLeftX >= last.upLeftX && first.upLeftX <= last.bottomRightX;
      // let last_left_skip = pos_left >= cell.upLeftX && cell.upLeftX < pos_right;
      let first_right_skip = first.upLeftX <= last.upLeftX && last.upLeftX <= first.bottomRightX;
      // let last_right_skip = pos_left <= cell.bottomRightX && cell.bottomRightX <= pos_right;
      return first_left_skip || first_right_skip;
    }
    self.get_distance = (from, to) => {
      if (!from || (from && !from.upLeftX)) {
        return NaN;
      }
      if (!to || (to && !to.upLeftX)) {
        return NaN;
      }
      return Math.abs(from.upLeftX - to.upLeftX)
    }
    self.get_distance_bottom = (froms, tos, distance) => {
      let list_from = froms.map(cell => cell && cell.bottomRightX ? cell.bottomRightX : 0);
      let list_to = tos.map(cell => cell && cell.bottomRightX ? cell.bottomRightX : 0);
      return Math.abs(Math.max(...list_from) - Math.min(...list_to)) > distance;
    }
    self.extract_cell = (cell, pos_index = -1) => {
      let padding = Math.ceil(cell.width / `${cell.desc || ' '}`.length);
      let tmp = `${cell.desc}`
      let res = [];
      if (new RegExp("^([a-zA-Z]{1})([\\*\\★]+)([\\d\\,\\.]+)$", "g").test(`${cell.desc}`)) {
        const exs = new RegExp("^([a-zA-Z]{1})([\\*\\★]+)([\\d\\,\\.]+)$", "g").exec(`${cell.desc}`);
        return [{ ...cell, desc: `${exs[3]}` }];
      }
      if (cell.desc && pos_index > -1 && pos_index <= 2 && self.regex_date.match(`${cell.desc}`) > -1 && self.regex_date.match(`${cell.desc}`) < 1) {
        res = self.regex_date.split(cell.desc);
        if (res[0] && `${res[0]}`.length === 3 && `${Number(res[0])}`.length === 3 && !isNaN(Number(res[0]))) {
          res = res.slice(1);
        }
        if (res[2] && `${res[2]}`.length === 3 && `${Number(res[2])}`.length === 3 && !isNaN(Number(res[2]))) {
          res = res.slice(0, -1);
        }
        res = res.filter(v => v && `${v}`.length > 0)
      } else {
        res = self.split_value(cell.desc);
      }
      if (cell.desc && (`${tmp}`.match(new RegExp("([0-9]{1,2}[\\/\\s]{1,3}[0-9]{1,2}[回目]{2})", "g")) || []).length === 1) {
        let m = `${tmp}`.match(new RegExp("([0-9]{1,2}[\\/\\s]{1,3}[0-9]{1,2}[回目]{2})", "g")) || []
        res = [];
        let index = tmp.indexOf(m[0]);
        let f = tmp.slice(0, index);
        let l = tmp.slice(index + tmp.length);
        res = [f, m[0], l].filter(v => v && `${v}`.length > 0);
        // self.debug("RES:extract_cell", tmp, res)
      }
      // self.debug("self.extract_cell:", res)
      if (res.some(v => `${v || ''}`.includes("***"))) {
        // res = `${cell.desc}`.split("").reduce((n, o) => {
        //   if (["*"].includes(o)) {
        //     n.push(null);
        //   } else {
        //     let i = n.length - 1;
        //     if (n[i] === null) {
        //       n.push(o);
        //     } else {
        //       n[i] = `${n[i]}${o}`;
        //     }
        //   }
        //   return n;
        // }, []).filter(v => v);
        res = res.reduce((n, o) => {
          if (`${o || ''}`.includes("***")) {
            let match = (o.match(/[\*]+/g) || []).filter(v => v.length >= 3);
            if (match.length > 0) {
              let nmatch = match.reduce((nn, oo, i) => {
                let index = o.indexOf(oo);
                if (index > -1) {
                  if (o.slice(0, index).length > 0) {
                    nn.push(o.slice(0, index));
                  }
                  nn.push(oo);
                  o = o.slice(index + oo.length);
                }
                if (i === match.length - 1 && o.length > 0) {
                  nn.push(o);
                }
                return nn;
              }, []);
              n.push(...nmatch);
            } else {
              n.push(o);
            }
          } else {
            n.push(o);
          }
          return n;
        }, []);
      }
      if (res.length === 1) {
        return [{ ...cell, desc: res[0] }];
      }
      return res.reduce((n, o) => {
        let width = (o.length || 1) * padding;
        let new_cell = n.length > 0 ? { ...n[n.length - 1], desc: o, width } : { ...cell, desc: o, width };
        n.length > 0 ? new_cell.upLeftX = n[n.length - 1].bottomRightX : null;
        new_cell.bottomRightX = new_cell.upLeftX + width;
        n.push(new_cell);
        return n;
      }, []).filter(v => v.desc);
    }
    self.split_value = (desc) => {
      let tmp = desc;
      desc = (desc || '').toString().trim();
      desc = desc.split(" ").join("");
      if (self.regex_date.match(desc) > -1) {
        // self.debug(" self.split_value:elf.regex_date:", desc)
        return [desc];
      }
      if (desc.includes(".")) {
        desc = desc.split(".").join(",");
      }
      if (desc.includes("・")) {
        desc = desc.split("・").join(",");
      }
      if (self.regex_price.is_number(desc)) {
        return [desc];
      }
      let res = desc.match(new RegExp("[0-9,*.\\-・]+", "g")) || [];
      if (res.length === 0 && !desc.includes("***")) {
        return [desc];
      }
      // self.debug(tmp, "<I><self.split_value>", res);
      res = res.reduce((n, o, i) => {
        let index = desc.indexOf(o);
        if (index > -1) {
          if (desc.slice(0, index).length > 0) {
            n.push(desc.slice(0, index));
          }
          n.push(o);
          desc = desc.slice(index + o.length);
        }
        if (i === res.length - 1 && desc.length > 0) {
          n.push(desc);
        }
        return n;
      }, []);
      // self.debug(tmp, "<II><self.split_value>", res);
      res = res.reduce((n, o) => {
        let x = n.length - 1, y = n[x].length - 1;
        let _check = (v) => new RegExp("[0-9,*.\\-・]+", "g").test(v) && v.length > 3;
        if (_check(o)) {
          n.push([o]);
        } else {
          if (y > -1 && _check(n[x][y] || '')) {
            n.push([o]);
          } else {
            n[x].push(o);
          }
        }
        return n;
      }, [[]]);
      // self.debug(tmp, "<III><self.split_value>", res);
      return res.map(v => v.join(""));
    }
    self.is_box_star = (desc) => {
      desc = (desc || '').toString().trim();
      return (desc.match(/[\*]/g) || []).length === desc.length;
    }
    self.empty = (desc) => desc === null || desc === undefined || desc === '' || desc === 'undefined' || desc === 'null';
    self.isMainRecipe = ([balance0, payment1, deposit1, balance1]) => {
      const E0 = self.convert_to_number(balance0);
      const C1 = self.convert_to_number(payment1);
      const D1 = self.convert_to_number(deposit1);
      const E1 = self.convert_to_number(balance1);
      if ((self.empty(payment1) && !self.empty(deposit1)) || (!self.empty(payment1) && self.empty(deposit1))) {
        return E1 === E0 - C1 + D1;
      } else if (self.empty(payment1) && self.empty(deposit1)) {
        return false;
      } else if (!self.empty(payment1) && !self.empty(deposit1)) {
        return E1 === E0 - 0 + D1 || E1 === E0 - C1 + 0;
      }
      return E1 === E0 - C1 + D1;
    }
    self.get_description = (text_list, replate_text) => {
      replate_text.sort((a, b) => `${a}`.length > `${b}`.length ? -1 : 1);
      const getIndex = (text) => {
        return replate_text.findIndex(val => `${val}` === `${text}` || `${text}`.includes(`${val}`));
      }
      let description = text_list.map(text => {
        if (new RegExp("([\\d]{1,2})([-]{1,2})([\\d]{1,2})([-]{1,2})([\\d]{1,2})", "g").test(text)) {
          return text;
        }
        let value, _text = text;
        let index = getIndex(_text);
        if (index > -1) {
          value = replate_text[index];
          replate_text.splice(index, 1);
          return `${text}`.replace(value, "");
        }
        if (self.regex_price.is_number(text)) {
          _text = self.convert_to_number(text);
          index = getIndex(_text);
          if (index > -1) {
            value = replate_text[index];
            replate_text.splice(index, 1);
            return `${_text}`.replace(value, "");
          }
        }
        if (self.regex_price.is_number(text)) {
          _text = self.map_to_number(text);
          index = getIndex(_text);
          if (index > -1) {
            value = replate_text[index];
            replate_text.splice(index, 1);
            return `${_text}`.replace(value, "");
          }
        }
        return text;
      }).filter(val => !self.empty(val)).join(" ");
      return self.remove_characters_noide(description).split(" ").reduce((n, o) => {
        if (o.length > 0) {
          n.push(o);
        }
        return n;
      }, []).join(" ");
    }
    self.formar_date = (desc) => {
      const regex =new RegExp("[.,\\/#!$%\\^&\\*;:{}=\\-_`~()\"\\[\\]'\\|\\\\．，／＃！＄％＾＆＊；：｛｝＝－＿｀～（）・＂＇＼｜［］]", "g");
      desc = `${desc || ""}`
        .replace(regex, "-")
        .replace(new RegExp("^[.,\\/#!$%\\^&\\*;:{}=\\-_`~()\"\\[\\]'\\|\\\\．，／＃！＄％＾＆＊；：｛｝＝－＿｀～（）・＂＇＼｜［］]+$", "g"),
          ""
        )
        .replace(/-{2,}/g, "-");
      if (desc && desc.startsWith('-')) {
        desc = desc.slice(1);
      }
      if (desc && desc.endsWith('-')) {
        desc = desc.slice(0, -1);
      }
      return desc;
    };
    self.check_and_fix_missing_character = (desc_first, desc_last) => {
      desc_first = self
        .convert_to_number(self.remove_characters_noide(desc_first.toString()))
        .toString();
      desc_last = self
        .convert_to_number(self.remove_characters_noide(desc_last.toString()))
        .toString();
      console.log(desc_first, desc_last);
      let a, b;
      if (desc_first.length > desc_last.length) {
        a = desc_last;
        b = desc_first;
      } else {
        a = desc_first;
        b = desc_last;
      }
  
      const aLen = a.length;
      const bLen = b.length;
  
      let i = 0,
        j = 0;
      let missingCount = 0;
      let missingIndex = -1;
      let missingChar = null;
      if (desc_first.length == desc_last.length) {
        for (let i = 0; i < desc_first.length; i++) {
          if (desc_first[i] !== desc_last[i]) {
            missingCount++;
          }
        }
        return missingCount <= 1;
      }
  
      while (i < aLen && j < bLen) {
        if (a[i] === b[j]) {
          i++;
        } else {
          missingCount++;
          missingIndex = j;
          missingChar = b[j];
          if (missingCount > 1) {
            return false;
          }
        }
        j++;
      }
  
      if (j < bLen) {
        missingCount++;
        missingIndex = j;
        missingChar = b[j];
      }
  
      if (missingCount > 1) {
        return false;
      }
  
      let fixedString =
        a.slice(0, missingIndex) + b[missingIndex] + a.slice(missingIndex);
  
      return true;
    };
    self.is_mark_date_in_list = (lines) => {
      const total_mark = lines.reduce((res, line) => {
        const descs = line.map(cell => cell.desc).join("");
        res+= new RegExp("^(\\d{1,3}-\\d{3})[^\\d\\s]+[^\\d]*([\\d,]+)[^\\*]*\\*([\\d,]+)", "g").test(descs) ? 1 : 0;
        return res;
      },0);
      return lines.length / 2 < total_mark;
    }
    self.find_description_ids = (cell, line) => {
      let desc_content = cell.desc || '';
      line.sort((a, b) => `${b.desc || ''}`.length - `${a.desc || ''}`.length);
      let id_list = cell.nids || [];
      for (const { desc, nids, nid1 } of line) {
        if (desc && desc_content.includes(desc)) {
          desc_content = desc_content.split(desc).join("");
          if (Array.isArray(nids) && nids.length > 0) {
            id_list.push(...nids);
          } else if (nid1 && nid1.length > 0) {
            id_list.push(...nid1);
          }
        }
      }
      return id_list.reduce((res, id) => {
        !res.includes(id) ? res.push(id) : undefined;
        return res;
      }, []);
    }
  }
  const Utils = new PUtils();
  function Cell(cell, line, index, line_index, page_index) {
    let self = this;
    self._get_desc = () => cell.desc || '';
    self.inits = () => {
      for (const key in cell) {
        self[key] = cell[key];
      }
      self.index = index;
      self.list_active = [];
      self.page_index = page_index;
      self.line_index = line_index;
      self.header_lable = "none";
      self.cell_type = self.cell_type || self._detect_type();
      self.line = line;
      self.prev = null;
      self.next = null;
      self.number_list = [];
      self.texts = [];
      // Utils.debug("CELL:", self.desc, cell.desc, self.cell_type);
    }
    self.get = () => Object.entries(self).reduce((n, [key, value]) => {
      (typeof self[key] !== 'function' && !['prev', 'next', 'line', 'cell_type', 'list_active'].includes(key)) ? n[key] = value : null;
      return n;
    }, {});
    self.is_payment = (balance_prev, balance_current) => {
      balance_prev = Utils.convert_to_number(balance_prev);
      balance_current = Utils.convert_to_number(balance_current);
      let current = Utils.convert_to_number(self.desc);
      return balance_prev - current === balance_current;
    }
    self.is_balance = (balance_prev, payment, deposit) => {
      // Utils.debug(`is_balance || self.desc: ${self.desc}, balance_prev: ${balance_prev}, payment : ${payment}, deposit: ${deposit}`)
      if (Utils.empty(self.desc)) {
        return
      }
      balance_prev = Utils.convert_to_number(balance_prev);
      let balance_current = Utils.convert_to_number(self.desc);
      let skip = false;
      if (payment) {
        payment = Utils.convert_to_number(payment);
        skip = balance_current === balance_prev - payment;
      }
      if (!skip && deposit) {
        deposit = Utils.convert_to_number(deposit);
        skip = balance_current === balance_prev + deposit;
      }
      // Utils.debug(`is_balance || self.desc: ${self.desc}, balance_prev: ${balance_prev}, payment : ${payment}, deposit: ${deposit}, skip: ${skip}`)
      return skip;
    }
    self.is_deposit = (balance_prev, balance_current) => {
      balance_prev = Utils.convert_to_number(balance_prev);
      balance_current = Utils.convert_to_number(balance_current);
      let current = Utils.convert_to_number(self.desc);
      return balance_prev + current === balance_current;
    }
    self._detect_type = () => {
      let date_index = Utils.regex_date.match(self._get_desc());
      if ([0, 1].includes(date_index)) {
        return 'date';
      }
      let price_index = Utils.regex_price.match(self._get_desc());
      let amount_number = ((self._get_desc() || '').toString().match(new RegExp(/\d/g)) || []).join("");
      amount_number.length === 0 ? price_index = -1 : null;
      if ([0, 1].includes(price_index)) {
        return 'price';
      }
      if (date_index > -1 || price_index > -1) {
        return date_index > -1 ? 'date' : 'price';
      }
      return 'string';
    }
    self.inits();
  }
  function Headers() {
    const self = this;
    self.cached = [];
    self.status = "none";
    self.level = { date: -1, description: -1, payment: -1, deposit: -1, balance: -1 };
    self.total = 0;
    self.date;
    self.description;
    self.payment;
    self.deposit;
    self.balance;
    self.is_generator = false;
    self.is_retry_balance = false;
    self.is_retry_header = false;
    self.is_generator_auto = false;
    self.description_after_balance = false;
    self.inits = (list) => {
      self.cached = list;
      self.status = "none";
      self.level = { date: -1, description: -1, payment: -1, deposit: -1, balance: -1 };
      self.total = 0;
      self.date = null;
      self.description = null;
      self.payment = null;
      self.deposit = null;
      self.balance = null;
      if (list.length === 5) {
        const index = list.findIndex(cell => Utils.columns.description.list.includes(cell.desc));
        if (index === 4) {
          self.description_after_balance = true;
        }
      }
      // Utils.debug("self.inits:list")
      // Utils.writeLine(list);
      for (const cell of self.cached) {
        const item = Utils.columns.find(cell.desc);
        if (!item) {
          continue;
        }
        let { field, lable } = item;
        // Utils.debug(`HEADER:inits:`, field, lable, cell.desc)
        if (!self[field]) {
          self.level[field] = 1;
          field ? self[field] = cell : null;
          self[field].header_lable = field;
          self[field].mark_desc = cell.desc;
          self[field].desc = lable;
        }
      }
      // Utils.writeTable([[self.date, self.description, self.payment, self.deposit, self.balance]])
      if (!self.is_generator && !self.balance) {
        self.is_retry_balance = true;
      }
      if (!self.is_generator) {
        self.is_retry_header = self.level.payment === 1 && self.level.deposit === 1 && self.level.balance === 1 ? true : false;
      }
      self.total = Object.entries(self.level).reduce((n, [key, value]) => value === 1 ? n + 1 : n, 0);
      if (self.total === 5) {
        return
      }
      if (self.description && self.description.desc && self.balance && self.balance.desc && self.description.upLeftX > self.balance.upLeftX) {
        self.description = null;
      }
      if (self.total >= 2) {
        self.generator();
      }
      // Utils.writeLine([self.date, self.description, self.payment, self.deposit, self.balance])

    }
    self.get_padding = () => {
      let columns = [self.date, self.description, self.payment, self.deposit, self.balance].filter(cell => cell);
      columns.sort((a, b) => a.upLeftX < b.upLeftX ? -1 : 1);
      if (columns.length > 0) {
        return
      }
      let min = columns[0].upLeftX;
      let max = columns[columns.length - 1].bottomRightX;
      let min_width = (max - min) / columns.length;
      return min_width;
    }
    self.debug = () => {
      let columns = [self.date, self.description, self.payment, self.deposit, self.balance];
      columns.sort((a, b) => a.upLeftX < b.upLeftX ? -1 : 1);
      Utils.writeLine(columns)
    }
    self.get = () => {
      let columns = [self.date, self.description, self.payment, self.deposit, self.balance];
      columns.sort((a, b) => a.upLeftX < b.upLeftX ? -1 : 1);
      return columns;
    }
    self.generator = () => {
      self.is_generator = true;
      let columns = [self.date, self.description, self.payment, self.deposit, self.balance];
      let index_header = columns.findIndex(cell => cell && cell.desc);
      let first_columns = columns.slice(0, index_header);
      let last_columns = columns.slice(index_header + 1, columns.length);
      let cell_active = columns[index_header];
      // Utils.writeTable([columns])
      // Utils.writeLine([cell_active], ['desc', 'mark_desc'])
      // Utils.writeLine(first_columns, ['desc', 'mark_desc','first_columns'])
      // Utils.writeLine([...last_columns,self.balance], ['desc', 'mark_desc','upLeftX','last_columns'])
      first_columns = first_columns.reduceRight((n, cell) => {
        cell = self.create(n.length > 0 ? n[0] : cell_active, true);
        n = [cell, ...n];
        return n;
      }, []);
      last_columns = last_columns.reduce((n, cell, index) => {
        let next_cell = last_columns[index + 1] || null;
        !cell ? cell = self.create(n.length > 0 ? n[n.length - 1] : cell_active) : null;
        if (next_cell && next_cell.upLeftX && next_cell.upLeftX > cell.bottomRightX) {
          cell.upLeftX = (next_cell.upLeftX - cell.upLeftX) / 2 + cell.upLeftX;
          cell.bottomRightX = cell.upLeftX + cell.width;
        }
        // if (next_cell && next_cell.upLeftX && cell.bottomRightX > next_cell.upLeftX) {
        //     cell.bottomRightX = next_cell.upLeftX;
        // }
        n.push(cell);
        return n;
      }, []);
      // Utils.writeTable([[...first_columns,cell_active,...last_columns]])
      columns = [...first_columns, cell_active, ...last_columns];
      self.date = { ...columns[0], header_lable: 'date' };
      self.description = { ...columns[1], header_lable: 'description' };
      self.payment = { ...columns[2], header_lable: 'payment' };
      self.deposit = { ...columns[3], header_lable: 'deposit' };
      self.balance = { ...columns[4], header_lable: 'balance' };
    }
    self.align_center = () => {
      let columns = self.get()
      columns = columns.reduce((n, current, index) => {
        let next = columns[index + 1] || null;
        return n;
      }, []);
    }
    self.generator_auto = (cell, max_value) => {
      self.is_generator_auto = true;
      self.is_generator = true;
      // Utils.debug("HEADER:generator_auto", cell.upLeftY, cell.bottomRightX, max_value);
      // cell = self.generator_auto_cell_date(cell);
      let max_width = ((max_value - cell.bottomRightX) / 4) - 40;
      let columns = [null, null, null, null, null];
      cell.desc = Utils.columns.date.lable;
      columns = columns.reduce((n, o, index) => {
        if (index === 0) {
          n.push(cell);
        } else {
          const new_cell = self.create(n.length > 0 ? n[n.length - 1] : cell, false);
          if (new_cell.width > max_width) {
            new_cell.width = max_width;
            new_cell.upLeftY = new_cell.upLeftX - 40;
            new_cell.bottomRightX = new_cell.upLeftX + new_cell.width;
          }
          n.push(new_cell);
        }
        return n;
      }, []);
      columns.forEach((vcell, index) => {
        if (index > 0 && vcell.width < max_width) {
          vcell.width < max_width ? vcell.width = max_width : null;
          vcell.upLeftX = columns[index - 1].bottomRightX + 40;
          vcell.bottomRightX = vcell.upLeftX + vcell.width;
        }
      })
      columns = columns.reduce((n, cell, index) => {
        let next_cell = columns[index + 1] || null;
        if (next_cell && next_cell.upLeftX && next_cell.upLeftX > cell.bottomRightX) {
          cell.upLeftX = (next_cell.upLeftX - cell.upLeftX) / 2 + cell.upLeftX;
          cell.bottomRightX = cell.upLeftX + cell.width;
        }
        // if (next_cell && next_cell.upLeftX && cell.bottomRightX > next_cell.upLeftX) {
        //     cell.bottomRightX = next_cell.upLeftX;
        // }
        n.push(cell);
        return n;
      }, []);

      return columns;
      // if (columns[4].bottomRightX <= max_value || Math.abs(columns[4].bottomRightX - max_value) <= 50) {
      //     return columns;
      // }
      // cell.bottomRightX = cell.bottomRightX - 25;
      // cell.width = cell.width - 25;
      // // Utils.debug("HEADER:generator_auto retry", cell.upLeftY, cell.bottomRightX, columns[4].bottomRightX);
      // return self.generator_auto(cell, max_value);
    }

    self.create = (cell, type = false) => {
      let desc = cell.desc;
      let item = Utils.columns.find(cell.desc);
      if (item) {
        let { index } = item;
        index = type ? index - 1 : index + 1;
        desc = index >= 0 && index <= 4 ? Utils.columns.get_lable_by_index(index) : cell.desc;
      }
      let max_amout_desc = Math.max(`${cell.mark_desc || ''}`.length, `${cell.desc || ''}`.length);
      let tex_wdith = (cell.width / max_amout_desc) * (desc).length;
      let padding = (cell.width / max_amout_desc);
      return {
        desc: desc,
        width: tex_wdith,
        height: cell.height,
        upLeftX: type ? cell.upLeftX - padding - tex_wdith : cell.upLeftX + padding + tex_wdith,
        bottomRightX: type ? cell.upLeftX - padding : cell.bottomRightX + padding + tex_wdith,
        upLeftY: cell.upLeftY,
        bottomRightY: cell.bottomRightY,
        nids: [],
        nid1: "",
        engineList: [],
        type: 'generator'
      }
    }
    self.split_value = (line) => {
      let columns = [self.date, self.description, self.payment, self.deposit, self.balance];
      for (let index = 0; index < columns.length; index++) {
        const header = columns[index];
        let cell = line[index];
        switch (header.header_lable) {
          case 'date':

            break;

          default:
            break;
        }
      }
    }
    self.find_payment_or_deposit = (line) => {
      let cells = [line.date, line.description, line.payment, line.deposit, line.balance];
      let skip_payment = !line.payment.cell_type || (['none', 'string', 'date'].includes(line.payment.cell_type));
      let skip_deposit = !line.deposit.cell_type || (['none', 'string', 'date'].includes(line.deposit.cell_type));
      if (skip_payment && skip_deposit) {
        let pos_left = Math.min(self.payment.upLeftX, self.deposit.upLeftX);
        let pos_right = Math.max(self.payment.bottomRightX, self.deposit.bottomRightX);
        let { payment, deposit } = cells.reduce((n, cell, index) => {
          let first_left_skip = cell.upLeftX >= pos_left && pos_left >= cell.bottomRightX;
          let last_left_skip = pos_left >= cell.upLeftX && cell.upLeftX < pos_right;
          let first_right_skip = cell.upLeftX <= pos_right && pos_right <= cell.bottomRightX;
          let last_right_skip = pos_left <= cell.bottomRightX && cell.bottomRightX <= pos_right;
          if ((first_left_skip || last_left_skip) && (first_right_skip || last_right_skip) && cell.cell_type === 'price') {
            let diameter_payment = Math.abs(self.payment.upLeftX - cell.upLeftX);
            let diameter_deposit = Math.abs(self.deposit.upLeftX - cell.upLeftX);
            if (diameter_payment < diameter_deposit) {
              if (!n.payment) {
                n.payment = { cell, index };
              } else {
                if (Math.abs(self.payment.upLeftX - n.payment.cell.upLeftX) > diameter_payment) {
                  n.payment = { cell, index };
                }
              }
            } else {
              if (!n.deposit) {
                n.deposit = { cell, index };
              } else {
                if (Math.abs(self.deposit.upLeftX - n.deposit.cell.upLeftX) > diameter_deposit) {
                  n.deposit = { cell, index };
                }
              }
            }
          }
          return n;
        }, { payment: null, deposit: null });
        const reset_cell = (index) => {
          switch (index) {
            case 0:
              line.date = {};
              break;
            case 1:
              line.description = {};
              break;
            case 2:
              line.payment = {};
              break;
            case 3:
              line.deposit = {};
              break;
            case 4:
              line.balance = {};
              break;
            default:
              break;
          }
        }
        if (payment && payment.cell.cell_type === 'price' && line.payment.cell_type !== 'price') {
          line.payment = payment.cell;
          reset_cell(payment.index);
        }
        if (deposit && deposit.cell.cell_type === 'price' && line.deposit.cell_type !== 'price') {
          line.deposit = deposit.cell;
          reset_cell(deposit.index);
        }
      }
    }
    self.find_balance = (line) => {
      if (!line.balance || (line.balance && Object.keys(line.balance).length === 0) || (line.balance && [line.payment.desc, line.deposit.desc].includes(line.balance.desc))) {
        let cells = line.row;
        let pos_left = self.balance.upLeftX;
        let pos_right = self.balance.bottomRightX;
        let { balance } = cells.reduce((n, cell, index) => {
          let first_left_skip = cell.upLeftX >= pos_left && pos_left >= cell.bottomRightX;
          let last_left_skip = pos_left >= cell.upLeftX && cell.upLeftX < pos_right;
          let first_right_skip = cell.upLeftX <= pos_right && pos_right <= cell.bottomRightX;
          let last_right_skip = pos_left <= cell.bottomRightX && cell.bottomRightX <= pos_right;
          if ((first_left_skip || last_left_skip) && (first_right_skip || last_right_skip) && cell.cell_type === 'price') {
            let distance = Math.abs(self.balance.upLeftX - cell.upLeftX);
            if (!n.balance || (n.balance && distance < n.distance)) {
              n = { distance, balance: cell };
            }
          }
          return n;
        }, { balance: null, distance: null });
        if (balance) {
          let res = Utils.regex_price.split(balance.desc);
          if (res[1]) {
            line.balance = line.copyCell({ ...balance });
            line.balance.desc = res[1];
            line.detect_set_balance();
          }
          // Utils.debug("HEADER:find_balance,", line.balance.desc, balance.desc, res)
        }
      }
    }
    self.retry_balance = (cells) => {
      if (!self.balance || (self.balance && Object.keys(self.balance).length === 0) || cells.length === 0 || !self.is_retry_balance) {
        return;
      }
      let { balance } = cells.reduce((n, o, i) => {
        let distance = Math.abs(self.balance.upLeftX - o.upLeftX);
        if (i === 0) {
          n = { distance, balance: o };
        } else if (n.distance && n.distance > distance) {
          n = { distance, balance: o };
        }
        return n;
      }, { balance: null, distance: null });
      return balance;
    }
    self.get_item_by_index = (lable) => {
      let columns = self.get()
      let index = columns.findIndex(cell => cell.header_lable === lable);
      return index === -1 ? { index: -1, item: null } : { index: index, item: columns[index] };
    }
    self.check_is_header = (cell) => {
      let columns = self.get()
      let { header } = columns.reduce((n, o) => {
        let pos_left = o.upLeftX;
        let pos_right = o.bottomRightX;
        let first_skip = cell.upLeftX >= pos_left && pos_right > cell.upLeftX;
        let last_skip = pos_left >= cell.upLeftX && cell.bottomRightX > pos_left;
        if (first_skip || last_skip) {
          const distance = Math.abs(o.upLeftX - cell.upLeftX);
          if (!n.header || (n.header && n.distance > distance)) {
            n = { header: o, distance };
          }
        }
        return n;
      }, { header: null, distance: null });

      const get_label = (col) => {
        if (col.header_lable) {
          return col.header_lable;
        } else {
          let item = Utils.columns.find(col.desc);
          if (item) {
            return item.field;
          }
        }
        return null;
      }
      if (header) {
        // Utils.debug("Headers:check_is_header", cell.desc, header.desc || 'k x d');
        return get_label(header);
      } else {
        let index = columns.findIndex((o, i) => {
          if (i <= columns.length - 2) {
            return o.upLeftY < cell.upLeftX && cell.upLeftX < columns[i + 1].upLeftX;
          }
          return false;
        })
        if (index > -1) {
          // Utils.debug("HEADER:check_is_header:other", index, cell.desc);
          // Utils.writeLine([cell, columns[index], columns[index + 1]]);
          if (cell.bottomRightX <= columns[index + 1].upLeftX) {
            return get_label(columns[index]);
          } else {
            if (Math.abs(cell.upLeftX - columns[index].upLeftX) < Math.abs(cell.upLeftX - columns[index + 1].upLeftX)) {
              return get_label(columns[index]);
            } else {
              return get_label(columns[index + 1]);
            }
          }
        }
      }
      return null;
    }
    self.get_header_by_lable = (lable) => self[lable] || null;
  }
  function Line(page, line, line_index, page_index) {
    let self = this;
    self.date = {};
    self.description = {};
    self.payment = {};
    self.deposit = {};
    self.balance = {};
    self.prev = null;
    self.next = null;
    self.desc_line = 0;
    self.line = [];
    self.headers;
    self.row = [];
    self.is_correct = false;
    self.is_replate = false;
    self.mask_list = [];
    self.cell_prices = []
    self.number_list = []
    self.description_cells = [];
    self.line_index = line_index;
    self.text_list = [];
    self.inits = () => {
      self.headers = page.headers;
      self.text_list = line.reduce((n, { upLeftX, bottomRightX, desc, nids , nid1 }) => {
        n.push({ upLeftX, bottomRightX, desc: desc, nids , nid1 });
        return n;
      }, []);
      self.number_list = line.filter(cell => (`${cell.desc}`.match(/[0-9]/g) || []).join("").trim().length > 0).map(cell => (`${cell.desc}`.match(/[0-9]/g) || []).join(""));
      // Utils.debug("self.number_list:",self.number_list)
      if (self.headers.is_generator_auto) {
        let last_index = line.reduceRight((n, cell, index) => {
          if (index > 0 && n === -1 && (`${(cell.desc || '')}`.includes("*") || `${(cell.desc || '')}`.includes("★"))) {
            n = index;
          } else if (index > 0 && n === -1 && line[index - 1] && (`${(line[index - 1].desc || '')}`.includes("***"))) {
            n = index;
          }
          return n;
        }, -1);
        // Utils.debug("self.headers.is_generator_auto:", self.headers.is_generator_auto, last_index)
        last_index > -1 ? line = line.slice(0, last_index + 1) : null;
      }
      // Utils.debug("BEFORE SORT")
      // Utils.writeLine(line);
      line = line.reduce((n, o, i) => {
        let ex_line = self.process_extract_cell(o);
        ex_line = ex_line.filter(cell => {
          if (!cell.desc) {
            return false;
          }
          if (line_index > 1 && i >= 1 && `${cell.desc}`.split("").every(v => ['*', '★'].includes(v))) {
            return false;
          }
          return true;
        })
        n.push(...ex_line);
        return n;
      }, []);

      const headers = self.headers.get();
      if (headers.length === 5) {
        // let slice_desc_line = line
        // .filter(cell => cell.upLeftX < headers[1]?.upLeftX)
        // .map(cell => cell.desc).join("");
        // slice_desc_line = Utils.regex_date.split(slice_desc_line);
        line = line.filter(cell => {
          if (cell.bottomRightX < headers[0].upLeftX && Utils.regex_date.match(cell.desc) === -1) {
            return false;
          }
          if (cell.upLeftX > headers[headers.length - 1].bottomRightX && !Utils.regex_price.is_number(cell.desc)) {
            return false;
          }
          return true;
        })
      }


      line.sort((a, b) => a.upLeftX < b.upLeftX ? -1 : (a.upLeftX === b.upLeftX ? 0 : 1));
      let index_date = line.findIndex(cell => Utils.regex_date.match(cell.desc) > -1)
      index_date == -1 ? index_date = 3 : null
      line.forEach(cell => {
        if (cell.desc && `${cell.desc}`.includes(",") && Utils.regex_price.is_number(cell.desc)) {
          cell.desc = Utils.regex_price.remove_last(cell.desc)
        }
      })
      if (line[index_date + 1] && index_date > -1 && Utils.regex_price.is_number(line[index_date + 1].desc) && `${line[index_date + 1].desc}`.length === 3 && Math.abs(line[index_date].bottomRightX - line[index_date + 1].upLeftX) <= 80) {
        self.description_cells.push(line[index_date + 1])
        line.splice(index_date + 1, 1)
      }
      // Utils.debug("AFTER SORT");
      // Utils.writeLine(line);
      self.desc_line = line.map(cell => cell.desc || cell.descOrigin || '');
      self.line = [...line].reduce((n, cell, index) => {
        cell = new Cell({ ...cell }, self, index, line_index, page_index);
        index > 0 ? n[index - 1].next = cell : null;
        index > 0 ? cell.prev = n[index - 1] : null;
        n.push(cell);
        return n;
      }, []);
      self.row = [...line].reduce((n, cell, index) => {
        cell = new Cell({ ...cell }, self, index, line_index, page_index);
        index > 0 ? n[index - 1].next = cell : null;
        index > 0 ? cell.prev = n[index - 1] : null;
        n.push(cell);
        return n;
      }, []);
      self.cell_prices = self.row.filter(v => v.cell_type && v.cell_type === "price" && (`${v.desc}`.startsWith("*") || `${v.desc}`.startsWith("¥") || `${v.desc}`.startsWith("★")))

      Utils.writeLine(self.number_list)
      self.mask_list = [...line].map(({ desc, upLeftX, upLeftY, bottomRightX, bottomRightY, width, height }) => {
        return { desc, upLeftX, upLeftY, bottomRightX, bottomRightY, width, height };
      })
    }
    self.set = (key, value) => {
      self[key] = value;
    }
    self.in_number_list = (cell) => Utils.in_number_list(self.number_list, cell);
    self.texts = () => {
      return self.row.map(({ upLeftX, bottomRightX, desc }) => {
        return { upLeftX, bottomRightX, desc };
      });
    }
    self.get_description = () => {
      let cells = [];
      if (self.date && self.date.bottomRightX) {
        cells = self.row.filter(cell => cell.upLeftX >= (self.date.bottomRightX - 10));
      }
      if (self.balance && self.balance.upLeftX) {
        cells = cells.filter(cell => cell.bottomRightX <= (self.balance.upLeftX + 10));
      }
      const descs = [self.date.desc, self.balance.desc, self.payment.desc, self.deposit.desc].filter(v => !Utils.empty(v));
      const texts = cells.map(cell => cell.desc);
      if (texts.length === 0) {
        return self.description.desc;
      }
      return Utils.get_description(texts, descs);
    }
    self.filterLastRow = () => {
      let max = self.description.bottomRightX || self.balance.bottomRightX || self.payment.bottomRightX || self.deposit.bottomRightX || self.description.bottomRightX || 0;
      let list = self.mask_list.filter(v => v.bottomRightX < max + v.height / 2 && v.bottomRightX > max - v.height - (v.height / 2));
      if (list && list.length > 0) {
        max = Math.max(self.balance.upLeftX || 0, self.payment.upLeftY || 0, self.deposit.upLeftY || 0);
        let num_list = [self.date.upLeftX || 0, self.payment.upLeftX || 0, self.deposit.upLeftX, self.balance.upLeftX || 0].filter(v => v > 0)
        let min = Math.min(...num_list);
        list = list.filter(v => v.upLeftX >= min && v.upLeftX <= max);
        let desc = list.map(cell => cell.desc);
        this.description = self.cloneCell(self.description || self.date || self.payment || self.deposit || self.balance, { desc: desc.join(" ") });
        self.replate_description_main();
      }
    }
    self.process_extract_cell = (cell) => {
      if (Utils.detect_no_line_price(cell.desc)) {
        return [cell];
      }
      let desc = (cell.desc || '').toString().split(" ").join("");
      let first_regex = Utils.regex_price.list[0];
      let last_regex = Utils.regex_price.list[Utils.regex_price.list.length - 1];
      let padding = Math.ceil(cell.width / desc.length);
      if ((desc.match(new RegExp(first_regex)) || []).length >= 1) {
        return (desc.match(new RegExp(first_regex)) || []).reduce((n, o) => {
          let width = (o.length || 1) * padding;
          let new_cell = n.length > 0 ? { ...n[n.length - 1], desc: o, width } : { ...cell, desc: o, width };
          n.length > 0 ? new_cell.upLeftX = n[n.length - 1].bottomRightX : null;
          new_cell.bottomRightX = new_cell.upLeftX + width;
          n.push(new_cell);
          return n;
        }, [])
      }
      if (new RegExp(last_regex).test(desc) && (desc.match(new RegExp(/[*]/g)) || []).length >= 4 && (desc.match(new RegExp(last_regex)) || []).length >= 2) {
        let items = (cell.desc || '').toString().split("").reduce((n, o) => {
          n.length === 0 ? n.push("") : null;
          if (o === '*') {
            n.push("*");
          } else {
            n[n.length - 1] += o;
          }
          return n;
        }, []);
        return items.reduce((n, o) => {
          let width = (o.length || 1) * padding;
          let new_cell = n.length > 0 ? { ...n[n.length - 1], desc: o, width } : { ...cell, desc: o, width };
          n.length > 0 ? new_cell.upLeftX = n[n.length - 1].bottomRightX : null;
          new_cell.bottomRightX = new_cell.upLeftX + width;
          n.push(new_cell);
          return n;
        }, []).filter(vcell => vcell.desc.trim().length > 0 && vcell.desc !== '*');
        // return (desc.match(new RegExp(last_regex)) || []).reduce((n, o) => {
        //     let width = (o.length || 1) * padding;
        //     let new_cell = n.length > 0 ? { ...n[n.length - 1], desc: o, width } : { ...cell, desc: o, width };
        //     n.length > 0 ? new_cell.upLeftX = n[n.length - 1].bottomRightX : null;
        //     new_cell.bottomRightX = new_cell.upLeftX + width;
        //     n.push(new_cell);
        //     return n;
        // }, []);
      }
      return [cell];
    }
    self.copyCell = (cell, option = {}) => {
      return self.line.reduce((n, col, index) => {
        if (cell.upLeftX === col.upLeftX && cell.bottomRightX === col.bottomRightX && cell.desc === col.desc) {
          let new_cell = new Cell({ ...cell.get(), ...option }, self, index, line_index, page_index);
          n = new_cell;
        }
        return n;
      }, {});
    }
    self.move_to_lables = (lables) => {
      let res = [null, self.cloneCell(self.payment), self.cloneCell(self.deposit)];
      for (const lable of [null, ...lables.slice(0, 2)]) {
        if (lable === null) {
          res.push(null);
        } else {
          res.push(self[lable] ? self.cloneCell(self[lable]) : null);
        }
      }
      lables.forEach((lable, idx) => {
        res[idx] ? self[lable] = res[idx] : null;
      });
    }
    self.cloneCell = (cell, option = {}) => {
      let vindex = 0;
      let res = self.line.reduce((n, o, index) => {
        let distance = Math.abs(o.upLeftX - cell.upLeftX);
        if (index === 0 || (distance < n.distance)) {
          n = { distance, cell: o, index };
        }
        return n;
      }, { distance: 0, cell: null, index: 0 });
      if (res.cell && Math.abs(res.cell.upLeftX - cell.upLeftX) <= (cell.width || res.cell.width) / 2) {
        cell = res.cell;
        vindex = res.index;
      }
      let item = typeof cell.get === 'function' ? cell.get() : cell;
      return new Cell({ ...item, ...option }, self, vindex, line_index, page_index)
    }
    self.exec = () => {
      // Utils.writeLine([...self.row, ...self.headers.cached]);
      Utils.debug("self.number_listself.number_listself.number_listself.number_listself.number_listself.number_listself.number_listself.number_list")
      Utils.writeLine(self.number_list);
      self.detect();
      Utils.debug("AFTER:self.detect()")
      // Utils.writeLine([self.date, self.description, self.payment, self.deposit, self.balance]);
      self.split_value();
      Utils.debug("AFTER:self.split_value()")
      Utils.writeLine([self.date, self.description, self.payment, self.deposit, self.balance]);
      self.convert_value();
      Utils.debug("AFTER:self.convert_value()")
      Utils.writeLine([self.date, self.description, self.payment, self.deposit, self.balance]);
    }

    self.correct = () => {
      if (self.prev) {
        // let balance_prev = self.prev && self.prev.balance ? (self.prev.balance.desc || '') : '';
        // let balance_current = self.balance ? (self.balance.desc || '') : '';
        // // Utils.debug("LINE:correct", self.date.desc, balance_prev, balance_current)
        // if (balance_prev && balance_current) {
        //     if (self.payment && typeof self.payment.is_payment === 'function' && self.payment.desc && self.payment.desc.length > 0 && self.payment.is_payment(balance_prev, balance_current)) {
        //         self.deposit.desc = '';
        //         self.is_correct = true;
        //     } else if (self.deposit && typeof self.deposit.is_deposit === 'function' && self.deposit.desc && self.deposit.desc.length > 0 && self.deposit.is_deposit(balance_prev, balance_current)) {
        //         self.payment.desc = '';
        //         self.is_correct = true;
        //     }
        // }
        self.verify();
        // Utils.writeLine([self.date, self.description, self.payment, self.deposit, self.balance]);
      }
    }
    self.format = (debug = false) => {
      let desc = Utils.remove_characters_noide(self.payment.desc);
      self.payment = self.cloneCell(self.payment, { desc: desc });
      desc = Utils.remove_characters_noide(self.deposit.desc);
      self.deposit = self.cloneCell(self.deposit, { desc: desc });
      desc = Utils.remove_characters_noide(self.balance.desc);
      self.balance = self.cloneCell(self.balance, { desc: desc });
      debug ? Utils.debug(`date: ${self.date.desc},description: ${self.description.desc}, payment: ${self.payment.desc}, deposit: ${self.deposit.desc}, balance: ${self.balance.desc}`) : null;
    }
    self.get = () => {
      let number_list = self.number_list;
      self.date.number_list = number_list;
      self.description.number_list = number_list;
      self.payment.number_list = number_list;
      self.deposit.number_list = number_list;
      self.balance.number_list = number_list;
      self.date.texts = self.text_list;
      self.description.texts = self.text_list;
      self.payment.texts = self.text_list;
      self.deposit.texts = self.text_list;
      self.balance.texts = self.text_list;
      const columns = [self.date, self.description, self.payment, self.deposit, self.balance];
      if (self.headers.description_after_balance) {
        columns.forEach(cell => cell.description_after_balance = self.headers.description_after_balance);
      }
      return columns;
    };

    self.detect = () => {
      let cell_price_list = [];
      let v_index = []

      for (let index = 0; index < self.row.length; index++) {
        const cell = self.row[index];
        switch (cell.cell_type) {
          case 'date':
            if (Object.keys(self.date).length === 0) {
              self.date = cell;
              // if (self.date && self.date.desc && self.cell_prices.length === 2) {
              //   const [first, last] = self.cell_prices
              //   const balance = self.headers.get_item_by_index("balance")
              //   const deposit = self.headers.get_item_by_index("deposit")
              //   const payment = self.headers.get_item_by_index("payment")
              //   let list_index = [{ ...balance, lable: "balance" }, { ...deposit, lable: "deposit" }, { ...payment, lable: "payment" }].sort((a, b) => a.index < b.index ? -1 : 1)
              //   //process last
              //   // Utils.debug(list_index[2].lable, list_index)
              //   self.headers.debug()

              //   if (list_index.slice(0, 2).every(v => ['deposit', 'payment'].includes(v.lable))) {
              //     self[list_index[2].lable] = last
              //     list_index = list_index.slice(0, 2)
              //     if (self.prev && self.prev.cell_prices.length >= 2 && self.prev.balance && self.prev.balance.desc && self.balance && self.balance.desc) {
              //       if (Utils.convert_to_number(self.prev.balance.desc) > Utils.convert_to_number(self.balance.desc)) {
              //         self.payment = first
              //       } else {
              //         self.deposit = first
              //       }
              //     }else if(Utils.get_distance(list_index[0].item, cell) < Utils.get_distance(list_index[1].item,cell)) {
              //       self[list_index[0].lable] = first
              //     }else{
              //       self[list_index[1].lable] = first
              //     }
              //     for (const _cell of self.row) {
              //       if (_cell.desc && ![self.date.desc, self.balance.desc, self.payment.desc, self.deposit.desc].some(v => v === _cell.desc)) {
              //         self.update_description(_cell, self.headers.get_header_by_lable("description"));
              //       }
              //     }
              //     Utils.writeLine([self.date, self.description, self.payment, self.deposit, self.balance])
              //     break
              //   }

              // }
              continue;
            }
            break;
          default:
            break;
        }


        if ((`${cell.desc}`.match(new RegExp("[0-9]{1,2}[\\/\\s]{1,3}[0-9]{1,2}[回目]{2}", "g")) || []).length > 0) {
          self.update_description(cell, self.headers.get_header_by_lable("description"));
          v_index.push(index)
          continue;
        }

        let lable = self.headers.check_is_header(cell);
        Utils.debug("LINE:detect", lable, cell.desc)
        if (!lable && [self.payment, self.deposit].some(vcell => vcell && vcell.desc) && Object.keys(self.balance).length === 0 && Utils.regex_price.match(cell.desc) > -1) {
          self.balance = cell;
          // Utils.debug("LINE:detect_balance", lable, cell.desc)
          continue;
        }
        let header = lable ? self.headers.get_header_by_lable(lable) : null;
        let cell_focus;
        switch (lable) {
          case 'date':
            if (Object.keys(self.date).length > 0) {
              cell_focus = self.cloneCell(self.date);
              self.date = self.date_priority(self.date, cell, header);
              if (cell.desc !== self.date.desc) {
                self.update_description(cell, header);
              } else {
                self.update_description(cell_focus, header);
              }
              v_index.push(index)
            } else {
              self.date = cell;
              self.date.header_lable = lable;
            }
            break;
          case 'description':
            self.update_description(cell, header);
            v_index.push(index)
            break;
          case 'payment':
          case 'deposit':
          case 'balance':
            if (lable === 'balance' && Utils.detect_no_line_price(cell.desc)) {
              self.update_column_price(lable, cell, header);
            } else if (((cell.desc || '').match(new RegExp(/[\d]/g)) || []).length === 0) {
              header = self.headers.get_header_by_lable('description');
              self.update_description(cell, header);
            } else {
              if (self[lable] && Object.keys(self[lable]).length > 0 && self[lable].handwrite) {
                // let skip_price_01 = Utils.regex_price.match(self[lable].desc) > Utils.regex_price.match(cell.desc);
                self[lable] = cell;
              } else {
                self.update_column_price(lable, cell, header);
              }

            }
            break;
          default:
            if (self.headers.date && self.headers.date.upLeftX && self.headers.balance && self.headers.balance.upLeftX) {
              if (self.headers.date.upLeftX < cell.upLeftX && cell.bottomRightX < self.headers.balance.upLeftX) {
                header = self.headers.get_header_by_lable('description')
                self.update_description(cell, header);
              }
            }
            if (!lable && cell.cell_type === 'price') {
              cell_price_list.push(cell);
            }
            break;
        }
      }
      if (Object.keys(self.balance).length === 0 && cell_price_list.length > 0) {
        self.balance = self.headers.retry_balance(cell_price_list);
        self.detect_set_balance();
        !self.balance ? self.balance = {} : null;

      }
      // Utils.writeLine(cell_price_list);
    }
    self.detect_set_balance = () => {
      const columns = self.headers.get();
      if (self.balance && columns.length === 5) {
        const check_in_content = (first, last) => {
          if (!first || !last) {
            return false;
          }
          const arr_first = [first.upLeftX, first.upLeftY, first.bottomRightX, first.bottomRightY, first.desc];
          const arr_last = [last.upLeftX, last.upLeftY, last.bottomRightX, last.bottomRightY, last.desc];
          return arr_first.every((val, idx) => arr_last[idx] === val);
        }

        if (columns[3].header_lable === 'deposit' && check_in_content(self.deposit, self.balance)) {
          self.deposit = self.cloneCell(self.balance, { desc: "" });
        } else if (columns[3].header_lable === 'payment' && check_in_content(self.payment, self.balance)) {
          self.payment = self.cloneCell(self.balance, { desc: "" });
        }
      }
    }
    self.update_column_price = (name, cell, header) => {
      if (`${cell.desc}`.split("").every(v => v === "*")) {
        return;
      }
      if (new RegExp("^([0-9]+)(\\/)([0-9]+)", "g").exec(`${cell.desc}`)) {
        return self.update_description(cell, header);
      }
      if (['回目', "月"].some(val => `${cell.desc}`.endsWith(val))) {
        return self.update_description(cell, header);
      }
      let max = Math.max(self.date.bottomRightX || 0, self.payment.bottomRightX || 0, self.deposit.bottomRightX || 0, self.balance.bottomRightX || 0);
      if ((self.date || self.payment || self.deposit || self.balance) && cell.bottomRightX < max + cell.height) {
        return;
      }
      if (self[name]) {
        let cell_focus = self[name];
        if (Object.keys(self[name]).length > 0) {
          self[name] = self.price_priority(self[name], cell, header);
          if (self[name].desc === cell.desc && self[name].upLeftX === cell.upLeftX && self[name].bottomRightX === cell.bottomRightX) {
            let prev_name = name === 'balance' ? 'deposit' : (name === 'deposit' ? 'payment' : (name === 'payment' ? 'description' : null));

            if (prev_name) {
              header = self.headers.get_header_by_lable(prev_name);
              if (header && prev_name !== 'description') {
                self.update_column_price(prev_name, cell_focus, header);
              } else if (header && prev_name === 'description') {
                self.update_description(cell_focus, header);
              }
            }
          }
        } else {
          self[name] = cell;
          self[name].header_lable = name;
        }
      }
    }
    self.is_pass = () => {
      if (self.prev && self.prev.balance) {
        if (self.balance.is_balance(self.prev.balance, self.payment, self.deposit)) {
          return true
        }
      }
      return false

    }
    self.update_description = (cell, header) => {
      let max = self.date.bottomRightX || self.payment.bottomRightX || self.deposit.bottomRightX || self.balance.bottomRightX || 0;
      if ((self.date || self.payment || self.deposit || self.balance) && cell.bottomRightX < max + (cell.height / 2)) {
        return;
      }
      if (['円', '(円)'].includes(cell.desc)) {
        return;
      }
      if (Utils.is_box_star(cell.desc)) {
        return;
      }
      if ((cell.desc || '').toString().split("").every(v => Utils.regex_price.text_match.includes(v))) {
        return;
      }
      if (!header) {
        header = self.headers.get_header_by_lable("description");
      }
      if (!header) {
        Utils.debug("Can't find header description");
        return;
      }
      let date = self.headers.get_header_by_lable("date");
      if (date && date.upLeftX > cell.bottomRightX) {
        return;
      }
      let balance = self.headers.get_header_by_lable("balance");
      if (balance && balance.bottomRightX < cell.upLeftX) {
        if(!self.headers.description_after_balance) {
          return;
        }
      }
      if (Object.keys(self.description).length > 0) {
        let type = cell.upLeftX < self.description.upLeftX;
        let height = Math.min(cell.height, self.description.height);
        let absHeight = Math.abs(cell.upLeftY - self.description.upLeftY);
        if (absHeight > height / 2) {
          type = false;
          // Utils.debug("self.update_description:", height, absHeight, self.date.desc, self.description.desc, cell.desc);
          // Utils.writeLine(self.line);
        }
        // if(self.date.desc ==='2-9-13') {
        //     Utils.debug("dddddddddddddddddd",type,height, absHeight,cell.upLeftX , self.description.upLeftX, self.date.desc,"+++++", self.description.desc,"+++++", cell.desc)
        // }
        self.description.desc = type ? `${cell.desc} ${self.description.desc}` : `${self.description.desc} ${cell.desc}`;
        !self.description.nids ? self.description.nids = [] : null;
        self.description.nids.push(...(cell.nids || []));
      } else {
        self.description = cell;
        self.description.header_lable = 'description';
        !self.description.nids ? self.description.nids = [] : null;
      }
      self.description.desc = (self.description.desc || '').toString().trim();
    }
    self.price_priority = (value_old, value_new, header) => {
      if (value_new.cell_type === 'price' && value_old.cell_type !== 'price') {
        return value_new;
      }
      if (value_new.cell_type !== 'price' && value_old.cell_type === 'price') {
        return value_old;
      }
      if (header) {
        let distance_old = Math.abs(header.upLeftX - value_old.upLeftX);
        let distance_new = Math.abs(header.upLeftX - value_new.upLeftX);
        let distance_right_old = Math.abs(header.bottomRightX - value_old.bottomRightX);
        let distance_right_new = Math.abs(header.bottomRightX - value_new.bottomRightX);
        return distance_old > distance_new || (distance_old < distance_new && distance_right_old > distance_right_new) ? value_new : value_old;
      }
      return value_old;
    }
    self.date_priority = (value_old, value_new, header) => {
      Utils.debug(`${value_old.desc}|${value_old.cell_type} <> ${value_new.desc}|${value_new.cell_type}`)

      if (value_new.cell_type === 'date' && value_old.cell_type !== 'date') {
        return value_new;
      }
      if (value_new.cell_type !== 'date' && value_old.cell_type === 'date') {
        return value_old;
      }
      if (value_new.cell_type !== 'date' && value_old.cell_type !== 'date') {
        // Utils.debug("self.date_priority use cell_type price")
        if (value_new.cell_type === 'price' && value_old.cell_type !== 'price') {
          return value_new;
        }
        if (value_new.cell_type !== 'price' && value_old.cell_type === 'price') {
          return value_old;
        }
        if (value_new.cell_type === 'price' && value_old.cell_type === 'price') {
          let first = ((value_new.desc || '').match(new RegExp(/[\d]/g)) || []).join("");
          let last = ((value_old.desc || '').match(new RegExp(/[\d]/g)) || []).join("");
          // Utils.debug(`first : ${first}, last: ${last}`);
          if (first.length > last.length && first.length >= 5) {
            return value_new;
          }
          if (last.length > first.length && last.length >= 5) {
            return value_old;
          }
          if (last.length >= first.length / 2 && last.length >= 4) {
            return value_old;
          }
          if (first.length >= last.length / 2 && first.length >= 4) {
            return value_new;
          }
        }
      }
      if (header) {
        let distance_old = Math.abs(header.upLeftX - value_old.upLeftX);
        let distance_new = Math.abs(header.upLeftX - value_new.upLeftX);
        let distance_right_old = Math.abs(header.bottomRightX - value_old.bottomRightX);
        let distance_right_new = Math.abs(header.bottomRightX - value_new.bottomRightX);
        Utils.debug(`distance_old: ${distance_old}, distance_new: ${distance_new}, distance_right_old: ${distance_right_old}, distance_right_new: ${distance_right_new}`, `<${(distance_old > distance_new || (distance_old < distance_new && distance_right_old > distance_right_new))}>`);
        return distance_old > distance_new || (distance_old < distance_new && distance_right_old > distance_right_new) ? value_new : value_old;
      }
      return value_old;
    }
    self.split_value = () => {
      let newCell;
      if (Utils.detect_no_line_price(self.balance.desc)) {
        if (self.payment && !Utils.empty(self.payment.desc)) {
          newCell = self.cloneCell(self.payment);
          self.update_description(newCell);
        }
        if (self.deposit && !Utils.empty(self.deposit.desc)) {
          newCell = self.cloneCell(self.deposit);
          self.update_description(newCell);
        }
        self.payment.desc = "";
        self.deposit.desc = "";
        self.is_replate = true;
        self.description.is_replate = true;
        self.payment.is_replate = true;
        self.deposit.is_replate = true;
        // Utils.debug("Line.split_value:detect_no_line_price", self.payment.desc, self.deposit.desc, self.date.desc)
      } else {
        if ([self.payment, self.deposit].every(cell => !Utils.empty(cell.desc)) && [self.payment, self.deposit].some(cell => cell.handwrite)) {
          if (self.payment.handwrite && self.payment && !Utils.empty(self.payment.desc)) {
            newCell = self.cloneCell(self.payment);
            self.update_description(newCell);
          }
          if (self.deposit.handwrite && self.deposit && !Utils.empty(self.deposit.desc)) {
            newCell = self.cloneCell(self.deposit);
            self.update_description(newCell);
          }
          self.payment.handwrite ? self.payment.desc = "" : null;
          self.deposit.handwrite ? self.deposit.desc = "" : null;
        }
        self.headers.find_payment_or_deposit(self);
        self.headers.find_balance(self);
      }
    }
    self.convert_value = () => {
      let res = Utils.regex_date.split(self.date.desc || '');
      self.date.desc = res[1];
      let newCell;
      if (res[2] && res[2].length > 0) {
        newCell = self.cloneCell(self.date, { desc: res[2] });
        self.update_description(newCell);
      }
      if (!self.balance.desc && Object.keys(self.payment).length > 0 && Object.keys(self.deposit).length > 0 && [self.payment, self.deposit].some(cell => cell.handwrite)) {
        if (self.payment.handwrite) {
          newCell = self.cloneCell(self.payment, { desc: self.payment.desc });
          self.update_description(newCell);
          self.payment.desc = "";
        }
        if (self.deposit.handwrite) {
          newCell = self.cloneCell(self.deposit, { desc: self.deposit.desc });
          self.update_description(newCell);
          self.deposit.desc = "";
        }
      }
      res = Utils.regex_price.split(self.payment.desc || '');
      self.payment.desc = res[1];
      if (res[0] && res[0].length > 0) {
        newCell = self.cloneCell(self.payment, { desc: res[0] });
        self.update_description(newCell);
      }
      if (res[2] && res[2].length > 0) {
        newCell = self.cloneCell(self.payment, { desc: res[2] });
        self.update_description(newCell);
      }
      res = Utils.regex_price.split(self.deposit.desc || '');
      self.deposit.desc = res[1];
      if (res[0] && res[0].length > 0) {
        newCell = self.cloneCell(self.deposit, { desc: res[0] });
        self.update_description(newCell);
      }
      if (res[2] && res[2].length > 0) {
        newCell = self.cloneCell(self.deposit, { desc: res[2] });
        self.update_description(newCell);
      }
      res = Utils.regex_price.split(self.balance.desc || '');
      self.balance.desc = res[1];
    }
    self.skip_check_payment_or_deposit = () => {
      let skip = false;
      Utils.debug("self.skip_check_payment_or_deposit", self.prev)
      if (self.prev && self.prev.balance && Object.keys(self.prev.balance).length > 0 && self.balance && self.balance && Object.keys(self.balance).length > 0) {
        let balance_prev = self.prev.balance.desc, balance_current = self.balance.desc;
        if (Object.keys(self.payment).length > 0 && self.payment.is_payment && typeof self.payment.is_payment === "function" && self.payment.is_payment(balance_prev, balance_current)) {
          skip = true;
        }
        if (!skip && Object.keys(self.deposit).length > 0 && self.deposit.is_deposit && typeof self.deposit.is_deposit === "function" && self.deposit.is_deposit(balance_prev, balance_current)) {
          skip = true;
        }
        if (!skip && Object.keys(self.payment).length > 0 && self.payment.is_deposit && typeof self.payment.is_deposit === "function" && self.payment.is_deposit(balance_prev, balance_current)) {
          skip = true;
        }
        if (!skip && Object.keys(self.deposit).length > 0 && self.deposit.is_payment && typeof self.deposit.is_payment === "function" && self.deposit.is_payment(balance_prev, balance_current)) {
          skip = true;
        }
      }
      return skip;
    }
    self.verify = (skip = false) => {
      let newCell;
      if (self.prev && self.prev.balance && Object.keys(self.prev.balance).length > 0 && self.balance && self.balance && Object.keys(self.balance).length > 0 && !Utils.empty(self.prev.balance.desc)) {
        let balance_prev = self.prev.balance.desc, balance_current = self.balance.desc;
        if (Object.keys(self.payment).length > 0 && !Utils.empty(self.payment.desc) && self.payment.is_payment && typeof self.payment.is_payment === "function" && self.payment.is_payment(balance_prev, balance_current)) {
          skip ? Utils.debug("verify case 1,", balance_prev, balance_current, self.payment.desc, self.deposit.desc) : null;
          self.payment.handwrite = false;
          self.deposit.desc = "";
          self.is_correct = true;
          return
        }
        if (Object.keys(self.deposit).length > 0 && !Utils.empty(self.deposit.desc) && self.deposit.is_deposit && typeof self.deposit.is_deposit === "function" && self.deposit.is_deposit(balance_prev, balance_current)) {
          skip ? Utils.debug("verify case 2,", balance_prev, balance_current, self.payment.desc, self.deposit.desc) : null;
          self.deposit.handwrite = false;
          self.payment.desc = "";
          self.is_correct = true;
          return
        }
        if (Object.keys(self.payment).length > 0 && !Utils.empty(self.payment.desc) && self.payment.is_deposit && typeof self.payment.is_deposit === "function" && self.payment.is_deposit(balance_prev, balance_current)) {
          skip ? Utils.debug("verify case 3,", balance_prev, balance_current, self.payment.desc, self.deposit.desc) : null;
          newCell = self.cloneCell(self.payment, {});
          self.deposit = newCell;
          self.payment.desc = "";
          self.is_correct = true;
          return
        }
        if (Object.keys(self.deposit).length > 0 && !Utils.empty(self.deposit.desc) && self.deposit.is_payment && typeof self.deposit.is_payment === "function" && self.deposit.is_payment(balance_prev, balance_current)) {
          skip ? Utils.debug("verify case 4,", balance_prev, balance_current, self.payment.desc, self.deposit.desc) : null;
          newCell = self.cloneCell(self.deposit, {});
          self.payment = newCell;
          self.deposit.desc = "";
          self.is_correct = true;
          return
        }
        self.detect_payment_or_deposit();
      }
      if (skip) {
        return;
      }
      self.detect_value();
      // self.verify(true);
    }
    self.detect_payment_or_deposit = (debug = false) => {
      if (self.prev && self.prev.balance && Object.keys(self.prev.balance).length > 0 && self.balance && self.balance && Object.keys(self.balance).length > 0) {
        let replate_description = (desc) => {
          if (self.description.desc === desc) {
            self.description = {};
            return;
          }
          !self.description.desc ? self.description.desc = '' : null;
          self.description.desc = (self.description.desc || '').split(desc)
            .map(str => (str || '').trim())
            .join(" ").trim();

        }
        let balance_prev = self.prev.balance.desc, balance_current = self.balance.desc;
        for (const cell of self.line) {
          if (cell.cell_type === 'price' && cell.upLeftX < self.balance.upLeftX) {
            let res = Utils.regex_price.split(cell.desc);
            if (cell.is_payment && typeof cell.is_payment === "function" && cell.is_payment(balance_prev, balance_current)) {
              debug ? Utils.debug("detect_payment_or_deposit case 1,", balance_prev, balance_current, self.payment.desc, self.deposit.desc) : null;
              self.payment.desc ? self.update_description(self.payment) : null;
              self.payment = self.cloneCell(cell);
              self.payment.desc = res[1] || '';
              self.deposit.desc ? self.update_description(self.deposit) : null;
              self.deposit.desc = "";
              res[1] ? replate_description(res[1]) : null;
              self.is_correct = true;
              return
            }
            if (cell.is_deposit && typeof cell.is_deposit === "function" && cell.is_deposit(balance_prev, balance_current)) {
              debug ? Utils.debug("detect_payment_or_deposit case 2,", balance_prev, balance_current, self.payment.desc, self.deposit.desc) : null;
              self.payment.desc ? self.update_description(self.payment) : null;
              self.deposit.desc ? self.update_description(self.deposit) : null;
              self.deposit = self.cloneCell(cell);
              self.deposit.desc = res[1] || '';
              self.payment.desc = "";
              self.is_correct = true;
              // res[1] ? replate_description(res[1]) : null;
              return
            }
            if (debug) {
              Utils.debug("detect_payment_or_deposit case 3,", balance_prev, balance_current, self.payment.desc, self.deposit.desc);
              Utils.writeLine(self.row);
            }
          }
        }
      }
    }
    self.compaid_value = (position = null) => {
      if (self.isMainRecipe()) {
        return;
      }
      if (self.headers.is_retry_header) {
        self.detect_value();
        self.verify();

        self.mapvalue();
        self.replate_description_main();
        return
      }
      if (self.prev && self.prev.is_correct && self.prev.balance && self.prev.balance.upLeftX) {
        if (!self.balance || (self.balance && Utils.empty(self.balance.desc))) {
          let res_post_balance = [self.payment, self.deposit, self.balance].reduceRight((n, o, index) => {
            let distance = Math.abs(self.prev.balance.upLeftX - o.upLeftX);
            if (Utils.in_distance(o, self.prev.balance) && (n.index === -1 || distance < n.distance)) {
              n = { index, distance };
            }
            return n;
          }, { index: -1, distance: 0 });
          if (res_post_balance.index > -1 && res_post_balance.index !== 2) {
            self.balance = self.cloneCell([self.payment, self.deposit][res_post_balance.index]);
          }
        }
      }
      if (!self.balance || (self.balance && (Object.keys(self.balance).length === 0 || Utils.empty(self.balance.desc)))) {
        if (self.prev && self.prev.balance && !Utils.empty(self.prev.balance.desc) && self.next && self.next.balance && !Utils.empty(self.next.balance.desc)) {
          let balance_prev = Utils.convert_to_number(self.prev.balance.desc);
          let balance_next = Utils.convert_to_number(self.next.balance.desc);
          let payment_next = Utils.convert_to_number(self.next.payment.desc);
          let deposit_next = Utils.convert_to_number(self.next.deposit.desc);
          let payment_value = Utils.convert_to_number(self.payment.desc);
          let deposit_value = Utils.convert_to_number(self.deposit.desc);
          let res_value = [balance_next + payment_next, balance_next - deposit_next];
          if (res_value.includes(balance_prev - payment_value) && !Utils.empty(self.payment.desc) && self.in_number_list(`${balance_prev - payment_value}`)) {
            self.balance = self.cloneCell(self.prev.balance, { desc: `${balance_prev - payment_value}` });
          }
          if (res_value.includes(balance_prev + deposit_value) && !Utils.empty(self.deposit.desc) && self.in_number_list(`${balance_prev + deposit_value}`)) {
            self.balance = self.cloneCell(self.prev.balance, { desc: `${balance_prev + deposit_value}` });
          }
        }
      }
      if (self.balance && Object.keys(self.balance).length > 0 && !Utils.empty(self.balance.desc)) {
        if (self.payment && self.payment.upLeftX && self.payment.upLeftX >= self.balance.upLeftX) {
          self.payment = {};
        }
        if (self.deposit && self.deposit.upLeftX && self.deposit.upLeftX >= self.balance.upLeftX) {
          self.deposit = {};
        }
        self.detect_payment_or_deposit();
        if (self.balance && !Utils.empty(self.balance.desc) && self.prev && self.prev.balance && !Utils.empty(self.prev.balance.desc) && [self.payment, self.deposit].every((cell) => !cell || (cell && Utils.empty(cell.desc)))) {
          let _balance_prev = Utils.convert_to_number(self.prev.balance.desc);
          let _balance_current = Utils.convert_to_number(self.balance.desc);
          if (_balance_current < _balance_prev) {
            if (_balance_current - _balance_prev > 0 && self.in_number_list(`${_balance_current - _balance_prev}`)) {
              self.payment.desc = _balance_current - _balance_prev;
              self.is_correct = true;
            }

          } else if (_balance_current > _balance_prev && self.in_number_list(`${_balance_prev - _balance_current}`)) {
            if (_balance_prev - _balance_current > 0) {
              self.deposit.desc = _balance_prev - _balance_current;
              self.is_correct = true;
            }
          }
        }
      }
      self.detect_value();
      self.verify();

      self.mapvalue();
      self.replate_description_main();

    }
    self.replate_description_main = () => {
      let res = [self.payment.desc, self.deposit.desc, self.balance.desc].filter(desc => !Utils.empty(desc));
      res.sort((a, b) => (a || '').toString().length > (b || '').toString().length ? -1 : 1)
      res.forEach(desc => {
        let description_desc = (self.description.desc || '').toString();
        let vindex = -1;
        if (!Utils.empty(desc) && Utils.regex_price.is_number(desc)) {
          vindex = description_desc.lastIndexOf(desc || '');
          if (vindex === -1) {
            desc = Utils.map_to_number(desc);
            vindex = description_desc.lastIndexOf(desc || '');
          }

        } else if (!Utils.empty(desc)) {
          vindex = description_desc.lastIndexOf(desc || '');
        }
        if (description_desc === desc) {
          if (!Utils.empty(desc) && Utils.regex_price.is_number(desc)) {
            self.description.desc = "";
          }
          return;
        }
        if (vindex > -1) {
          if (Utils.regex_price.is_number(desc) && `${desc || ''}`.toString().length > 3) {
            self.description.desc = description_desc.split(desc).map(v => v.trim()).join(" ");
          } else {
            self.description.desc = description_desc.slice(0, vindex) + description_desc.slice(vindex + desc.length);
          }
        }
      })
      if (self.description && !Utils.empty(self.description.desc)) {
        self.description.desc = `${self.description.desc || ''}`.toString().trim();
      }
      // self.format(true);
    }
    self.mapvalue = (debug = false) => {
      if (self.isMainRecipe()) {
        return;
      }
      if (self.prev && self.prev.balance && !Utils.empty(self.prev.balance.desc) && self.next && self.next.balance && !Utils.empty(self.next.balance.desc)) {
        let balance_prev = Utils.convert_to_number(self.prev.balance.desc);
        let balance_next = Utils.convert_to_number(self.next.balance.desc);
        let payment_next = Utils.convert_to_number(self.next.payment.desc);
        let deposit_next = Utils.convert_to_number(self.next.deposit.desc);
        let payment_value = Utils.convert_to_number(self.payment.desc);
        let deposit_value = Utils.convert_to_number(self.deposit.desc);
        let balance_current = Utils.convert_to_number(self.balance.desc);
        let res_value = [balance_next + payment_next, balance_next - deposit_next];
        if (res_value.includes(balance_prev - payment_value) && balance_current !== balance_prev - payment_value && self.in_number_list(`${balance_prev - payment_value}`)) {
          self.balance = self.cloneCell(self.prev.balance, { desc: `${balance_prev - payment_value}` });
        } else if (res_value.includes(balance_prev + deposit_value) && balance_current !== balance_prev + deposit_value && self.in_number_list(`${balance_prev - deposit_value}`)) {
          self.balance = self.cloneCell(self.prev.balance, { desc: `${balance_prev + deposit_value}` });
        }
        if (self.balance && !Utils.empty(self.balance.desc) && self.prev && self.prev.balance && !Utils.empty(self.prev.balance.desc)) {
          balance_current = Utils.convert_to_number(self.balance.desc);
          if ([self.payment, self.deposit].every((cell) => !cell || (cell && Utils.empty(cell.desc))) && self.prev.is_correct) {
            if (balance_current < balance_prev && self.in_number_list(`${balance_prev - balance_current}`)) {
              self.payment.desc = balance_prev - balance_current;
              self.is_correct = true;
            } else if (balance_current > balance_prev && self.in_number_list(`${balance_current - balance_prev}`)) {
              self.deposit.desc = balance_current - balance_prev;
              self.is_correct = true;
            }
          } else {
            if (self.payment && self.payment.is_deposit && typeof self.payment.is_deposit === 'function' && self.payment.is_deposit(balance_prev, balance_current)) {
              self.deposit = self.cloneCell(self.payment);
              self.payment = {};
              self.is_correct = true;
            } else if (self.deposit && self.deposit.is_payment && typeof self.deposit.is_payment === 'function' && self.deposit.is_payment(balance_prev, balance_current)) {
              self.payment = self.cloneCell(self.deposit);
              self.deposit = {};
              self.is_correct = true;
            }
          }
        }
        debug ? Utils.debug(`mapvalue <${self.date.desc}> || balance: ${self.balance.desc} , balance_prev: ${self.prev.balance.desc} ,payment: ${self.payment && self.payment.desc ? self.payment.desc : null} ,deposit: ${self.deposit && self.deposit.desc ? self.deposit.desc : null} `) : null;
      }
    }
    self.isMainRecipe = () => {
      if (!self.prev || (self.prev && !self.prev.balance)) {
        return false;
      }
      if (Utils.isMainRecipe([self.prev.balance.desc, self.payment.desc, self.deposit.desc, self.balance.desc])) {
        return true;
      }
      return false;
    }
    self.detect_value = (debug = false) => {
      // compaid width prev line.
      if (!self.prev || (self.prev && (!self.prev.row || (self.prev.row && self.prev.row.length === 0)))) {
        return
      }
      if (self.isMainRecipe()) {
        return;
      }
      let compaid_prev_balance = (balance, current) => {
        for (let x = self.prev.row.length - 1; x >= 0; x--) {
          let cell = self.prev.row[x];

          if (!Utils.empty(cell.desc) && Utils.regex_price.is_number(cell.desc) && cell.cell_type === 'price') {
            // debug ? Utils.debug(`self.prev: x : ${x}, desc : ${cell.desc}, cell_type : ${cell.cell_type}`) : null;
            let balance_prev = cell.desc, balance_current = balance.desc;
            let skip_first = Object.keys(current).length > 0 && current.is_payment && typeof current.is_payment === "function" && current.is_payment(balance_prev, balance_current);
            let skip_last = Object.keys(current).length > 0 && current.is_deposit && typeof current.is_deposit === "function" && current.is_deposit(balance_prev, balance_current);

            if (skip_first) {
              debug ? Utils.debug(`skip_first:${skip_first}, ============ [${balance_prev} - ${current.desc} === ${balance_current}]`) : null;
              return { payment: current, balance_prev: cell, balance: balance };
            }

            if (skip_last) {
              debug ? Utils.debug(`skip_last:${skip_last}, ============ [${balance_prev} + ${current.desc} === ${balance_current}]`) : null;
              return { deposit: current, balance_prev: cell, balance: balance };
            }
          }
        }
        return null;
      }
      for (let x = self.row.length - 1; x >= 0; x--) {
        // debug ? Utils.debug(`x self.row: x : ${x}, desc : [${self.row[x].desc}], cell_type : ${self.row[x].cell_type}`) : null;
        if (!Utils.empty(self.row[x].desc) && self.row[x].cell_type === 'price' && Utils.regex_price.is_number(self.row[x].desc)) {
          for (let y = 0; y < self.row.length; y++) {
            // debug ? Utils.debug(`==================================x self.row: x : ${x}, desc : [${self.row[x].desc}], cell_type : ${self.row[x].cell_type}==================================`) : null;
            if (x > y && self.row[y].desc && self.row[y].cell_type === 'price' && Utils.regex_price.is_number(self.row[y].desc)) {
              // debug ? Utils.debug(`y self.row: y : ${y}, desc : [${self.row[y].desc}], cell_type : ${self.row[y].cell_type}, is_payment: ${typeof self.row[y].is_payment === "function"}, is_deposit: ${typeof self.row[y].is_deposit === "function"}`) : null;
              let res = compaid_prev_balance(self.row[x], self.row[y]);
              if (res) {
                if (res.payment) {
                  self.payment = self.cloneCell(res.payment);
                  self.deposit = {};
                } else if (res.deposit) {
                  self.deposit = self.cloneCell(res.deposit);
                  self.payment = {};
                }
                res.balance ? self.balance = self.cloneCell(res.balance) : null;
                debug ? Utils.debug(`compaid_prev_balance <${self.date.desc}> || balance: ${res.balance.desc} , balance_prev: ${res.balance_prev.desc} ,payment: ${res.payment && res.payment.desc ? res.payment.desc : null} ,deposit: ${res.deposit && res.deposit.desc ? res.deposit.desc : null} `) : null;
                if (res.balance_prev && self.prev.balance.desc !== res.balance_prev.desc) {
                  self.prev.balance = self.prev.cloneCell(res.balance_prev);
                }
                self.is_correct = true;

                return;
              }
            }
          }
        }
      }
      if (self.isMainRecipe()) {
        return;
      }
      // Utils.debug(`compaid_prev_balance <${self.date.desc}> || balance: ${self.balance.desc} , balance_prev: ${self.prev.balance.desc} ,payment: ${self.payment && self.payment.desc ? self.payment.desc : null} ,deposit: ${self.deposit && self.deposit.desc ? self.deposit.desc : null} `)
      if ((!self.balance || (Object.keys(self.balance).length > 0 && !self.balance.desc)) && [self.payment, self.deposit].every(cell => cell && !Utils.empty(cell.desc))) {
        if (self.payment && self.payment.is_balance && typeof self.payment.is_balance === 'function' && self.payment.is_balance(self.prev.balance.desc, null, self.deposit.desc)) {
          Utils.writeTable([[self.prev.balance, self.balance, self.payment, self.deposit]])
          self.balance = self.cloneCell(self.payment);
          self.payment = {};
          self.is_correct = true;
        } else if (self.deposit && self.deposit.is_balance && typeof self.deposit.is_balance === 'function' && self.deposit.is_balance(self.prev.balance.desc, self.payment.desc, null)) {
          self.balance = self.cloneCell(self.deposit);
          self.deposit = {};
          self.is_correct = true;
        }
      }
      if (debug) {
        return;
      }
      // Utils.debug("PREV===================================");
      // self.prev && self.prev.row ? Utils.writeLine(self.prev.row, ['desc', 'cell_type']) : null;
      // Utils.writeLine(self.row, ['desc', 'cell_type']);
      // self.detect_value(true);
    }
    self.inits();

  }
  function Page(page_content, page_index, page_list) {
    let self = this;
    self.content = [];
    self.index = page_index;
    self.headers = new Headers();
    self.others = [];
    self.lines = [];
    self.table = [];
    self.skip_break_line = false;
    self.location;
    self.inits = () => {
      try {
        self.content = typeof page_content === 'object' ? (Array.isArray(page_content) ? page_content : [page_content]) : JSON.parse(page_content);
      } catch (error) {
        Utils.debug(error);
      }
      self.content = self.content.reduce((n, o) => {
        n.push(...(o || []).filter(r => r.desc || r.descOrigin || r.category !== 'blank'));
        return n;
      }, []);
      self.content.sort((a, b) => {
        const skip_first = a.upLeftY == b.upLeftY && a.upLeftX === b.upLeftX
          , skip_last = (a.upLeftX - self.spread) <= b.upLeftX && (a.upLeftY - self.spread <= b.upLeftY && b.bottomRightY <= a.bottomRightY + self.spread);
        return skip_first ? 0 : (skip_last ? -1 : 1);
      });
      let content = [...self.content].reduce((n, cell) => {
        if (cell.width < cell.height && cell.width * 2 < cell.height) {
          Utils.debug("this box, the vertical width, does not support.", cell.desc);
        } else {
          cell.desc = ((cell.desc || '').length > (cell.descOrigin || '').length ? cell.desc : (cell.descOrigin || '')).toString();
          if (n.length === 0) {
            n.push([cell]);
          } else {
            let xindex = -1, yindex = -1;
            for (let index = 0; index < n.length; index++) {
              yindex = n[index].findIndex((col) => {
                const max_height = Math.max(cell.height, col.height);
                const min_height = Math.min(cell.height, col.height);
                const spread = max_height / 2;
                const skip_first = col.upLeftY <= cell.upLeftY && col.bottomRightY >= cell.upLeftY && (col.upLeftY + spread) >= cell.upLeftY && (col.bottomRightY + min_height / 2) >= cell.bottomRightY;
                const skip_last = cell.upLeftY <= col.upLeftY && cell.bottomRightY >= col.upLeftY && (cell.upLeftY + spread) > col.upLeftY;
                return skip_last || skip_first;
              });
              if (yindex > -1) {
                xindex = index;
                break;
              }
            }

            xindex > -1 ? n[xindex].push(cell) : n.push([cell]);
          }
        }
        return n;
      }, []);
      // Utils.writeTable(content);
      content = content.reduce((n, line, y) => {
        line.sort((a, b) => {
          let height = Math.min(a.height, b.height);
          let absHeight = Math.abs(a.upLeftY - b.upLeftY);
          if (absHeight <= height / 2) {
            return a.upLeftX < b.upLeftX ? -1 : (a.upLeftX === b.upLeftX ? 0 : 1);
          }
          return 1;
        });
        let mask_line = line.reduce((vn, o, i) => {
          if (y <= 1 && i <= 2 && `${o.desc}`.indexOf("**-**-**") > -1) {
            vn.push(o);
          } else {
            let new_cells = Utils.extract_cell(o, i);

            vn.push(...new_cells);
          }

          return vn;
        }, []);
        let date_list = mask_line.reduce((nn, cell, ii) => {
          let index_active = nn.length - 1;
          if (Utils.regex_date.match(cell.desc) !== -1) {
            nn.push({ date: cell, price_list: [], start: ii });
          } else if (index_active !== -1 && Utils.regex_price.is_number(cell.desc)) {
            nn[index_active].price_list.push(cell);
          }
          return nn;
        }, []);
        if (date_list.length > 1 && date_list.every(({ price_list }) => price_list.length >= 2)) {
          let line_list = date_list.map(({ start }, i) => {
            let end = i === date_list.length - 1 ? mask_line.length : date_list[i + 1].start;
            return mask_line.slice(start, end);
          })
          n.push(...line_list);
        } else {
          n.push(mask_line);
        }
        return n;
      }, []);

      Utils.writeTable(content);
      let { lines, headers, others, awaits, date_list, max_value, location } = content.reduce((n, line, index) => {
        let rect = line.reduce((a, cell) => {
          a.upLeftXs.push(cell.upLeftX);
          a.upLeftYs.push(cell.upLeftY);
          a.bottomRightXs.push(cell.bottomRightX);
          a.bottomRightYs.push(cell.bottomRightY);
          a.desc_line.push(cell.desc);
          return a;
        }, { upLeftXs: [], upLeftYs: [], bottomRightXs: [], bottomRightYs: [], desc_line: [] });
        let upLeftX = Math.min(...rect.upLeftXs);
        let upLeftY = Math.min(...rect.upLeftYs);
        let bottomRightX = Math.max(...rect.bottomRightXs);
        let bottomRightY = Math.max(...rect.bottomRightYs);
        if (index === 0) {
          n.location = { upLeftX, upLeftY, bottomRightX, bottomRightY };
        } else {
          n.location.upLeftX = Math.min(upLeftX, n.location.upLeftX);
          n.location.upLeftY = Math.min(upLeftY, n.location.upLeftY);
          n.location.bottomRightX = Math.max(bottomRightX, n.location.bottomRightX);
          n.location.bottomRightY = Math.max(bottomRightY, n.location.bottomRightY);
        }
        const desc_line = rect.desc_line;
        const match = Utils.columns.match(desc_line);
        let skip_headers = false;
        if (n.headers.length < match.length && match.length >= 2) {
          skip_headers = true;
          n.headers = line.map(cell => {
            try {
              if (cell.desc.includes("(") && cell.desc.includes(")")) {
                cell.desc = (cell.desc || "").toString().replace(new RegExp("\\([\\w\\W]\\)", "ig"), "");
              }
              cell.desc = (cell.desc || "").toString().replace(new RegExp("[a-zA-Z\\-\\)\\s]", "ig"), "");
            } catch (error) {
              Utils.debug(error, cell);
            }
            return cell;
          }).filter(cell => Utils.columns.find(cell.desc));

          //Check if the header is found and an element already exists in n.lines, then set it to an empty array
          if(!n.hasProcessedHeadersOnce && n.lines.length === 1){
            n.lines = [];
            n.others = [];
            n.awaits = []
          }
          n.hasProcessedHeadersOnce = true;
        }
        let slice_desc_line = desc_line;
        let header_index = -1;
        if (n.headers && n.headers.length >= 2) {
          header_index = n.headers.findIndex(cell => Utils.columns.find(cell.desc, [Utils.columns.description, Utils.columns.payment]));
          if (header_index > -1 && n.headers[header_index]) {
            let header = n.headers[header_index];
            slice_desc_line = line
              .filter(cell => cell.upLeftX < header.upLeftX)
              .map(cell => cell.desc);
          }
          if (header_index == -1) {
            slice_desc_line = line
              .filter(cell => cell.upLeftX < n.headers[0])
              .map(cell => cell.desc);
          }
        }
        // Utils.debug(slice_desc_line)
        const amount_price = Utils.regex_price.match(desc_line.join(""));
        let amount_date = Utils.regex_date.match(slice_desc_line.join(""));
        if (amount_date === -1 && n.headers && n.headers.length >= 2) {
          if (header_index > -1) {
            amount_date = (slice_desc_line.join("").match(/[0-9]+/gm) || []).join("").length > 3 ? 0 : -1;
          }
        }
        if (skip_headers && n.headers.length >= 3 && n.lines.length > 0 && n.lines.length <= 2 && Utils.get_distance_bottom(n.lines[0], n.headers, 150)) {
          n.lines = [];
        }
        skip_headers ? n.awaits = [] : null;
        Utils.debug(`skip_headers: ${skip_headers}, line.length:${line.length},desc_line:${desc_line}, regex_date: ${Utils.regex_date.match(desc_line.join(""))}, amount_date: ${amount_date}, amount_price: ${amount_price}`)
        if (!skip_headers && line.length >= 2 && ([0, 1].includes(Utils.regex_date.match(desc_line.join(""))) || (amount_date > -1 && amount_price > -1))) {
          // line = self.convertLine(line, index, page_index);
          self.process_before_awaits(n.lines, n.awaits, n.headers);
          n.awaits = [];
          n.lines.push(line);
          let index_date = line.findIndex(cell => {
            const vindexcell = Utils.regex_date.match(cell.desc);
            if (vindexcell === 5) {
              let vcell_date = cell.desc.slice(-9, -1);
              const year = vcell_date.slice(0, 4);    // "2023"
              const month = vcell_date.slice(-4, -2);   // "01"
              const day = vcell_date.slice(-2);
              cell.desc = `${year}/${month}/${day}`;
              Utils.debug(vcell_date, cell.desc);
            }
            return vindexcell > -1;
          });
          Utils.debug("index_date:", index_date, desc_line)
          index_date > -1 ? n.date_list.push(line[index_date]) : null;
          const _max_value = line.map(cell => cell.bottomRightX);
          Math.max(..._max_value) > n.max_value ? n.max_value = Math.max(..._max_value) : null;
        } else if (!skip_headers) {
          (n.headers && n.headers.length > 0) || (n.lines && n.lines.length > 0) ? n.awaits.push(line) : n.others.push(...line);
        };
        return n;
      }, { lines: [], headers: [], others: [], awaits: [], date_list: [], max_value: 0, location: { upLeftX: -1, upLeftY: -1, bottomRightX: -1, bottomRightY: -1 }, hasProcessedHeadersOnce: false });
      if (awaits && awaits.length > 0) {
        awaits.forEach(line => others.push(...line));
      }
      let columns_removes = headers.reduce((n, cell, i) => {
        if (Utils.columns.removes.some(v => v === cell.desc)) {
          n.push(cell)
        }
        return n
      }, []);
      lines.forEach((line) => {
        let index_date = line.findIndex(cell => Utils.regex_date.match(cell.desc) > -1)
        index_date == -1 ? index_date = 3 : null
        line.forEach((cell, i) => {
          if (i >= index_date && Utils.regex_price.is_number(cell.desc)) {
            let _desc = `${cell.desc}`.split(".").join(",")
            const old_desc = cell.desc
            cell.desc = _desc
          }
        })
        if (columns_removes.length > 0) {
          line = line.filter(cell => {
            let is_pass = columns_removes.some(v => Utils.in_distance(v, cell) && Utils.get_distance(v, cell) <= 50)
            if (Utils.regex_price.is_number(cell.desc) && is_pass) {
              return false;
            }
            return true;
          })
        }
      })
      self.location = location;
      Utils.debug("=========Utils.writeTable(lines)============")
      Utils.writeTable(lines);
      // Utils.writeLine(lines[0], ['desc', 'isTableItem', 'upLeftX', 'upLeftY', 'bottomRightX', 'bottomRightY', 'width', 'height'])
      // Utils.debug("lines.filter(line => line.some(cell => cell.isTableItem))", lines.filter(line => line.some(cell => cell.isTableItem)))
      if (headers.length <= 3 && lines.length <= 2) {
        self.skip_break_line = true;
        // let _lines = lines.filter(line => line.some(cell => cell.isTableItem));
        // if (_lines.length === 0 && lines.findIndex(line => line.some(cell => cell.isTableItem)))
      }

      // Utils.writeLine(headers)
      self.headers.inits(headers);
      if (date_list.length === 0) {
        return;
      }
      if (self.headers.total < 2 && date_list.length > 0) {
        let [date_pos_left, date_pos_right] = date_list.reduce((n, cell) => {
          n[0].push(cell.upLeftX);
          n[1].push(cell.bottomRightX)
          return n;
        }, [[], []]);
        date_pos_left = Math.min(...date_pos_left);
        date_pos_right = Math.min(...date_pos_right);
        // Utils.debug(date_pos_left, date_pos_right, max_value)
        let date_header_cell = { ...date_list[0], upLeftX: Math.ceil(date_pos_left), bottomRightX: Math.ceil(date_pos_right), desc: Utils.columns.date.lable };
        headers = self.headers.generator_auto(date_header_cell, max_value);
        // Utils.writeLine(headers)
        self.headers.inits(headers)
        // 
      }
      if (self.headers.balance) {
      }
      self.others = others;
      let header_index = headers.findIndex(cell => Utils.columns.find(cell.desc, [Utils.columns.description]));
      if (header_index > -1 && headers[header_index]) {
        lines = lines.filter(line => {
          const header = headers[header_index];
          const slice_desc_line = line
            .filter(cell => cell.upLeftX < header.upLeftX)
            .map(cell => cell.desc);
          return (slice_desc_line.join("").match(new RegExp(/[0-9]+/gm)) || []).join("").length >= 3;
        })
      }
      // Utils.debug("VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV", header_index, headers[header_index])
      Utils.debug("==========================lines.length:", lines.length)
      Utils.writeTable(lines);
      lines = self.predict_table(lines, headers);
      self.lines = lines.reduce((n, line, index) => {
        line = line.filter(cell => !Utils.columns.in_column(cell.desc));
        line = new Line(self, line, index, page_index);
        line.prev = index > 0 ? n[index - 1] : null;
        if (index === 0 && page_index > 0 && page_list[page_index - 1] && page_list[page_index - 1].lines && page_list[page_index - 1].lines.length > 0) {
          line.prev = page_list[page_index - 1].lines[page_list[page_index - 1].lines.length - 1];
        }
        if (index === lines.length - 1 && page_list.length > 0 && page_list[page_index - 1] && page_list[page_index - 1].lines && page_list[page_index - 1].lines.length > 0) {
          page_list[page_index - 1].lines[page_list[page_index - 1].lines.length - 1].next = line;
        }
        index > 0 ? n[index - 1].next = line : null;
        n.push(line);
        return n;
      }, []);
      // Utils.debug("self.headers.is_retry_header:", self.headers.is_retry_header)
      self.lines.forEach(line => line.exec(self.headers.is_retry_header));
      //if (!self.headers.is_retry_header) {
      let v = self.lines.map(line => line.get())
      Utils.debug("============================table get=====================")
      Utils.writeTable(v);
      if (!self.headers.is_retry_header || (self.headers.is_retry_header && self.lines.length >= 5)) {
        if (self.is_miss_balance()) {
          self.change_value_when_miss_balance();
          Utils.debug("============================table change_value_when_miss_balance=====================")
          Utils.writeTable(v);
        }
        self.lines.forEach(line => line.correct());
        v = self.lines.map(line => line.get())
        Utils.debug("============================table correct=====================")
        Utils.writeTable(v);
        let position = self.get_position();
        self.lines.forEach(line => line.compaid_value(position));
      }
      Utils.debug("============================table compaid_value=====================")
      v = self.lines.map(line => line.get())
      Utils.writeTable(v);
    }
    self.get_position = () => {
      let { balance, date, payment, deposit } = self.lines.reduce((n, o) => {
        o.date && o.date.upLeftX ? n.date.push(o.date.upLeftY) : null;
        o.payment && o.payment.upLeftX ? n.payment.push(o.payment.upLeftY) : null;
        o.deposit && o.deposit.upLeftX ? n.deposit.push(o.deposit.upLeftY) : null;
        o.balance && o.balance.upLeftX ? n.balance.push(o.balance.upLeftY) : null;
        return n;
      }, { balance: [], date: [], payment: [], deposit: [] });
      return {
        date: date.length > 0 ? Math.ceil(Number(eval(date.join("+"))) / date.length) : 0,
        payment: payment.length > 0 ? Math.ceil(Number(eval(payment.join("+"))) / payment.length) : 0,
        deposit: deposit.length > 0 ? Math.ceil(Number(eval(deposit.join("+"))) / deposit.length) : 0,
        balance: balance.length > 0 ? Math.ceil(Number(eval(balance.join("+"))) / balance.length) : 0
      }
    }

    self.predict_table = (table, headers, index = 0) => {
      if (table.length <= index) {
        return table;
      }
      const row = table[index];
      if (row.every(cell => cell.isMerge)) {
        const balance_item = headers.find(cell => Utils.columns.find(cell.desc, [Utils.columns.balance]));
        const deposit_item = headers.find(cell => Utils.columns.find(cell.desc, [Utils.columns.deposit]));
        const payment_item = headers.find(cell => Utils.columns.find(cell.desc, [Utils.columns.payment]));
        const date_item = headers.find(cell => Utils.columns.find(cell.desc, [Utils.columns.date]));
        const cells = [balance_item, deposit_item, payment_item].filter(cell => cell);
        if (row.lines && row.lines.length === 2 && row.lines.every(line => line.reduce((res, cell) => cell.desc ? res + 1 : res, 0) >= 2)) {
          Utils.debug(`=================PREDICT-TABLE-MERGE======================`)
          cells.sort((a, b) => a.upLeftX - b.upLeftX);
          Utils.writeLine(cells);
          Utils.writeTable(row.lines);
          const lines = row.lines.map(line => {
            return line.filter(cell => {
              let skip_first = cells[0].upLeftX <= cell.upLeftX;
              if (!skip_first) {
                skip_first = cells[0].upLeftX <= cell.bottomRightX;
              }
              let skip_last = cells[cells.length - 1].bottomRightX >= cell.bottomRightX;
              if (!skip_last) {
                skip_last = cells[cells.length - 1].bottomRightX >= cell.upLeftX;
              }
              return skip_first && skip_last;
            })
              .filter(cell => {
                return Utils.regex_price.is_number(cell.desc);
              })
          }).filter(line => line.length >= 2);
          Utils.writeTable(lines);
          if (lines.length >= 2 && lines.length === row.lines.length) {
            const [line_frist, line_last] = row.lines.map(line => {
              delete line.lines;
              return line;
            })
            table[index] = line_frist;
            if (line_last) {
              let status = false;
              if (table[index + 1]) {
                const index_date = table[index + 1].findIndex(cell => Utils.regex_date.match(cell.desc) > -1);
                if (index_date > -1) {
                  const date = table[index + 1][index_date];
                  const [first, last] = line_last.reduce((res, cell) => {
                    let skip_first = date.upLeftY <= cell.upLeftY;
                    if (!skip_first) {
                      skip_first = date.upLeftY <= cell.bottomRightY;
                    }
                    let skip_last = date.bottomRightY >= cell.bottomRightY;
                    if (!skip_last) {
                      skip_last = date.bottomRightY >= cell.upLeftY;
                    }
                    if (skip_first && skip_last) {
                      res[1].push(cell);
                    } else {
                      res[0].push(cell);
                    }
                    return res;
                  }, [[], []]);
                  Utils.writeTable([first, last]);
                  if (first.length === 0) {
                    status = true;
                    table[index + 1] = [...table[index + 1], ...last];
                    table[index + 1].sort((a, b) => a.upLeftX - b.upLeftX);
                  }
                }
              }
              if (!status) {
                const cell_date = date_item || table[index].find(cell => Utils.regex_date.match(cell.desc) > -1);
                cell_date ? cell_date.tmpDate = true : undefined;
                cell_date ? line_last.splice(0, 0, { ...cell_date, desc: Utils.regex_date.match(cell_date.desc) > -1 ? cell_date.desc : '00-00-00' }) : undefined;
                table.splice(index + 1, 0, line_last);
              }
            }
          }
          // Utils.writeTable(lines);
        }
      }
      if (index > 0) {
        const index_date = row.findIndex(cell => Utils.regex_date.match(cell.desc) > -1);
        if (index_date > - 1) {
          const date = row[index_date];
          const price_amount = row.slice(index_date + 1).reduce((res, cell) => {
            if (cell.desc && Utils.regex_price.match(cell.desc) > -1) {
              res++;
            }
            return res;
          }, 0);
          if (price_amount === 0) {
            const first_row = table[index - 1] || [];
            const last_row = table[index + 1] || [];
            const date_center_position = date.upLeftY + date.height / 2;
            //find from frist row
            if (first_row.length > 0) {
              const [first, last] = first_row.reduce((res, cell) => {
                let cell_center_position = cell.upLeftY + cell.height / 2;
                if (Math.abs(date_center_position - cell_center_position) < 4) {
                  res[1].push(cell);
                } else {
                  res[0].push(cell);
                }
                return res;
              }, [[], []]);
              table[index - 1] = first;
              row.push(...last);
              row.sort((a, b) => a.upLeftX - b.upLeftX);
            }
            if (last_row.length > 0) {
              const [first, last] = last_row.reduce((res, cell) => {
                let cell_center_position = cell.upLeftY + cell.height / 2;
                if (Math.abs(date_center_position - cell_center_position) < 4) {
                  res[1].push(cell);
                } else {
                  res[0].push(cell);
                }
                return res;
              }, [[], []]);
              table[index + 1] = first;
              row.push(...last);
              row.sort((a, b) => a.upLeftX - b.upLeftX);
            }
          }
        }
      }
      return self.predict_table(table, headers, index + 1);
    }

    self.process_before_awaits = (lines, awaits, headers) => {

      let header_index = headers.findIndex(cell => Utils.columns.find(cell.desc, [Utils.columns.description]));
      Utils.debug("self.process_before_awaits:", header_index)
      Utils.writeTable([headers])
      if (header_index > -1 && headers[header_index]) {
        const header = headers[header_index];
        const recursive = () => {
          if (awaits.length === 0) {
            return;
          }
          const line = awaits[0];
          awaits.shift();
          const slice_desc_line = line
            .filter(cell => cell.upLeftX < header.upLeftX)
            .map(cell => cell.desc);
          const amount_date = (slice_desc_line.join("").match(/[0-9]+/gm) || []).join("").length > 3 ? 0 : -1;
          // try {
          //     Utils.debug("process_before_awaits", amount_date, slice_desc_line)
          // } catch (error) {
          //     Utils.debug("process_before_awaits", amount_date, slice_desc_line, error)
          // }
          if (amount_date === -1) {
            if (lines.length > 0) {
              if (!lines[lines.length - 1]['lines']) {
                const obj = lines[lines.length - 1];
                lines[lines.length - 1]['lines'] = [[...obj]];
              }
              lines[lines.length - 1].push(...line);
              lines[lines.length - 1].forEach(cell => cell.isMerge = true);
              lines[lines.length - 1]['lines'].push(line);
            } else {
              lines.push(line);
            }
          } else {
            lines.push(line);
          }
          recursive();
        }
        recursive();
      } else if (headers.length === 0 && lines.length > 2) {
        const recursive = () => {
          if (awaits.length === 0) {
            return;
          }
          const line = awaits[0];
          awaits.shift();
          const slice_desc_line = line.slice(0, 2).map((cell) => cell.desc);
          const amount_date =
            (slice_desc_line.join("").match(/[0-9]+/gm) || []).join("").length > 3
              ? 0
              : -1;
          if (amount_date === -1) {
            lines.length > 0
              ? lines[lines.length - 1].push(...line)
              : lines.push(line);
          } else {
            lines.push(line);
          }
          recursive();
        };
        recursive();
      }else if(headers.length === 0 && Utils.is_mark_date_in_list(awaits) && awaits.length > 5){
        const recursive = () => {
          if (awaits.length === 0) {
            return;
          }
          const line = awaits[0];
          awaits.shift();
          const slice_desc_line = line.slice(0, 2).map((cell) => cell.desc);
          const amount_date =
            (slice_desc_line.join("").match(/[0-9]+/gm) || []).join("").length > 3
              ? 0
              : -1;
          if (amount_date === -1) {
            lines.length > 0
              ? lines[lines.length - 1].push(...line)
              : lines.push(line);
          } else {
            lines.push(line);
          }
          recursive();
        };
        recursive();
      }
    }
    self.is_miss_balance = () => {
      let status = false;
      status = self.lines.every((line => !line.balance || (line.balance && Utils.empty(line.balance.desc))));
      if (!status) {
        status = self.lines.every((line) => !line.balance || (line.balance && Utils.empty(line.balance.desc)) || (line.balance && `${line.balance.desc || ''}`.length === 4 && new RegExp(/^([\d]{3})(\*)$/g).test(`${line.balance.desc || ''}`)));
      }
      return status;
    }
    self.change_value_when_miss_balance = () => {
      let lables = self.headers.get().slice(-3).map((header) => header.header_lable);
      if (lables.length === 3) {
        console.log("lables:", lables)
        self.lines.forEach(line => line.move_to_lables(lables));
      }
    }
    self.get = () => {
      let table = self.lines.filter((line, index) => {
        if (index >= self.lines.length - 3 && Utils.regex_date.is_date(line.date.desc)) {
          return false;
        }
        if (self.lines.length <= 5) {
          if (!Utils.regex_date.verify(line.date.desc)) {
            return false;
          }
          if (line.date && self.location && Math.ceil(self.location.upLeftX + ((self.location.bottomRightX - self.location.upLeftX) / 3)) < line.date.upLeftX) {
            return false;
          }
        }
        if ([line.payment, line.deposit, line.balance].every(cell => !cell || (cell && (`${cell.desc}`.toString().length === 0) && !cell.is_replate))) {
          if (self.skip_break_line) {
            return line.skip_check_payment_or_deposit();
          } else if ([line.date].every(cell => !cell || (cell && !cell.isTableItem))) {
            return false;
          }
        }
        // Utils.debug(index,"page.get", line.date.desc,line.date && (line.date.desc || '').toString().length > 3)
        return line.date && (line.date.desc || '').toString().length > 3;
      });
      if ((table[table.length - 2] && table[table.length - 1].date.desc)) {
        table[table.length - 2].filterLastRow();
        table[table.length - 1].filterLastRow();
      } else if (table.length === 1) {
        table[table.length - 1].filterLastRow();
      }
      self.table = table.map(line => {
        line.replate_description_main();
        line = line.get()
        if (line[2]) {
          line[2].desc = Utils.remove_characters_noide(line[2].desc);
          line[2].desc = Utils.regex_price.is_number(line[2].desc) ? Utils.map_to_number(line[2].desc) : '';
        }
        if (line[3]) {
          line[3].desc = Utils.remove_characters_noide(line[3].desc);
          line[3].desc = Utils.regex_price.is_number(line[3].desc) ? Utils.map_to_number(line[3].desc) : '';
        }
        if (line[4]) {
          line[4].desc = Utils.remove_characters_noide(line[4].desc);
          line[4].desc = Utils.regex_price.is_number(line[4].desc) ? Utils.map_to_number(line[4].desc) : '';
        }
        let date = line[0].get && typeof line[0].get === 'function' ? line[0].get() : line[0];
        let description = line[1].get && typeof line[1].get === 'function' ? line[1].get() : line[1];
        let payment = line[2].get && typeof line[2].get === 'function' ? line[2].get() : line[2];
        let deposit = line[3].get && typeof line[3].get === 'function' ? line[3].get() : line[3];
        let balance = line[4].get && typeof line[4].get === 'function' ? line[4].get() : line[4];
        date.tmpDate ? date.desc = "" : undefined;
        return [date, description, payment, deposit, balance];
      });
      // Utils.writeTable(self.table);
      return self.table;
    };
    self.inits();
  }
  function Passbook(pages, target_index) {
    const self = this;
    self.pages = [];
    self.tables = [];
    self.inits = () => {
      self.pages = pages.reduce((n, page, index) => {
        page = new Page(page, index, n);
        n.push(page);
        return n;
      }, []);
      let tables = self.pages.reduce((n, page) => {
        let table = page.get();
        n.push(...table);
        return n;
      }, []);
      let page_list = Array(pages.length).fill(0).map(v => []);
      tables = self.verify(tables);
      tables = self.detect(tables);
      tables.forEach((line, i) => {
        let index = line.findIndex(cell => Object.keys(cell).includes("page_index"));
        if (index > -1) {
          let page_index = line[index].page_index;
          page_list[page_index].push(line);
        }
      });
      const colmuns_data = Utils.columns.get();
      const template_columns = ['明細行番号',...colmuns_data,'残高チェック'];
      let index_columns = keyConditions.map(o => template_columns.indexOf(o.key));
      self.tables = page_list.reduce((n, table, index) => {
        if (target_index.includes(-1) || target_index.includes(index)) {
          table = table.map((line, x) => {
            const no = {
              ...Object.create(line[0]),
              desc: (x + 1).toString(),
              descOrigin: (x + 1).toString(),
              nids: [],
              nid1: null,
              engineList: [],
              header_lable: "no",
              texts: [],
            };
            line = [no,...line];
            return index_columns.map((pos, y) => {
              let cell = pos > -1 && line[pos] ? line[pos] : {};
              const textIds = cell.header_lable && cell.header_lable ==="description" ? (cell.nids || []) : undefined;
              return new MappingDataModel(
                index, 
                cell.nid1 || `dummy_c_${x}_${y}`, 
                `${(cell.desc || '')}`,
                undefined,
                undefined,
                textIds
              )
            })

          })
          n.push(...table);
        }
        return n;
      }, []);
    }
    self.verify = (tables) => {
      return tables.reduce((n, [date, description, payment, deposit, balance], index) => {
        let [prev_date, prev_description, prev_payment, prev_deposit, prev_balance] = index > 0 ? n[index - 1] : [{ desc: "" }, { desc: "" }, { desc: "" }, { desc: "" }, { desc: "" }];
        let [next_date, next_description, next_payment, next_deposit, next_balance] = index < tables.length - 2 ? tables[index + 1] : [{ desc: "" }, { desc: "" }, { desc: "" }, { desc: "" }, { desc: "" }];
        let _payment = Utils.convert_to_number(payment.desc);
        let _deposit = Utils.convert_to_number(deposit.desc);
        let _balance = Utils.convert_to_number(balance.desc);
        let _index = [date, description, payment, deposit, balance].findIndex(cell => cell && typeof cell === 'object' && Object.keys(cell).includes("page_index"));
        let page_index = _index > -1 ? [date, description, payment, deposit, balance][_index].page_index : -1;
        _index = [prev_date, prev_description, prev_payment, prev_deposit, prev_balance].findIndex(cell => cell && typeof cell === 'object' && Object.keys(cell).includes("page_index"));
        let prev_page_index = _index > -1 ? [prev_date, prev_description, prev_payment, prev_deposit, prev_balance][_index].page_index : -1;
        _index = [next_date, next_description, next_payment, next_deposit, next_balance].findIndex(cell => cell && typeof cell === 'object' && Object.keys(cell).includes("page_index"));
        let next_page_index = _index > -1 ? [next_date, next_description, next_payment, next_deposit, next_balance][_index].page_index : -1;
        let skip = false, _prev_payment, _prev_deposit, _prev_balance, _next_payment, _next_deposit, _next_balance, res_first = [], res_last = [], tmp_balance;
        let tmp_value;
        if (index > 0) {
          _prev_payment = Utils.convert_to_number(prev_payment.desc);
          _prev_deposit = Utils.convert_to_number(prev_deposit.desc);
          _prev_balance = Utils.convert_to_number(prev_balance.desc);
        }
        if (index < tables.length - 2) {
          _next_payment = Utils.convert_to_number(next_payment.desc);
          _next_deposit = Utils.convert_to_number(next_deposit.desc);
          _next_balance = Utils.convert_to_number(next_balance.desc);
        }
        if (index === 0) {
          if (!balance.desc && [_next_payment, _next_deposit].some(v => v) && _next_balance) {
            if (next_payment.desc) {
              balance.desc = _next_payment + _next_balance;
            } else if (_next_deposit) {
              balance.desc = _next_payment - _next_deposit;
            }
          }
        } else if (index > 0) {
          if (prev_balance.desc) {
            // has balance
            if (balance.desc) {
              if (payment.desc && _prev_balance - _payment === _balance) {
                deposit.desc = "";
                skip = true;
              } else if (deposit.desc && _prev_balance + _deposit === _balance) {
                payment.desc = "";
                skip = true;
              } else if (payment.desc) {
                res_first = [_balance - _next_payment, _balance - _next_deposit, _balance + _next_deposit, _balance + _next_payment];
                tmp_balance = _prev_balance - _payment;
                res_last = [tmp_balance - _next_payment, tmp_balance - _next_deposit, tmp_balance + _next_deposit, tmp_balance + _next_payment];
                if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_first.includes(_next_balance) && _prev_balance - _balance > 0) {
                  payment = { ...payment, desc: _prev_balance - _balance };
                  deposit.desc = "";
                  skip = true;
                } else if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_last.includes(_next_balance) && _prev_balance - _payment > 0) {
                  Utils.debug("case balance A:", balance.desc, _prev_balance, res_last, _prev_balance - _payment);
                  balance = { ...balance, desc: _prev_balance - _payment };
                  deposit.desc = "";
                  skip = true;
                }
              } else if (deposit.desc) {
                res_first = [_balance - _next_payment, _balance - _next_deposit, _balance + _next_deposit, _balance + _next_payment];
                tmp_balance = _prev_balance + _deposit;
                res_last = [tmp_balance - _next_payment, tmp_balance - _next_deposit, tmp_balance + _next_deposit, tmp_balance + _next_payment];
                if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_first.includes(_next_balance) && _balance - _prev_balance > 0) {
                  Utils.debug("case deposit A:", deposit.desc, _next_balance, res_first, _balance - _prev_balance);
                  deposit = { ...deposit, desc: _balance - _prev_balance };
                  payment.desc = "";
                  skip = true;
                } else if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_last.includes(_next_balance)) {
                  balance = { ...balance, desc: tmp_balance };
                  payment.desc = "";
                  skip = true;
                }
              } else if (!deposit.desc && !payment.desc) {
                if (page_index - 1 === prev_page_index) {
                  res_first = [_balance - _next_payment, _balance - _next_deposit, _balance + _next_deposit, _balance + _next_payment];
                  res_last = [_prev_balance - _next_payment, _prev_balance - _next_deposit, _prev_balance + _next_deposit, _prev_balance + _next_payment];
                  if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_first.includes(_next_balance)) {

                  } else if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_last.includes(_next_balance)) {
                    balance = { ...balance, desc: prev_balance.desc };
                  }
                } else {
                  if (_prev_balance > _balance && _prev_balance - _balance > 0) {
                    payment = { ...payment, desc: _prev_balance - _balance };
                    deposit.desc = "";
                    skip = true;
                  } else if (_balance - _prev_balance > 0) {
                    deposit = { ...deposit, desc: _balance - _prev_balance };
                    payment.desc = "";
                    skip = true;
                  }
                }
              }
            } else {
              if (payment.desc && _next_balance) {
                tmp_balance = _prev_balance - _payment;
                res_last = [tmp_balance - _next_payment, tmp_balance - _next_deposit, tmp_balance + _next_deposit, tmp_balance + _next_payment];
                if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_last.includes(_next_balance)) {
                  balance = { ...balance, desc: _prev_balance - _payment };
                  deposit.desc = "";
                  skip = true;
                }
              } else if (deposit.desc && _next_balance) {
                tmp_balance = _prev_balance + _deposit;
                res_last = [tmp_balance - _next_payment, tmp_balance - _next_deposit, tmp_balance + _next_deposit, tmp_balance + _next_payment];
                if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_last.includes(_next_balance)) {
                  balance = { ...balance, desc: tmp_balance };
                  payment.desc = "";
                  skip = true;
                }
              } else if (!deposit.desc && !payment.desc && page_index - 1 === prev_page_index && _next_balance) {
                res_first = [_balance - _next_payment, _balance - _next_deposit, _balance + _next_deposit, _balance + _next_payment];
                res_last = [_prev_balance - _next_payment, _prev_balance - _next_deposit, _prev_balance + _next_deposit, _prev_balance + _next_payment];
                if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_first.includes(_next_balance)) {

                } else if ([_next_payment, _next_deposit].some(v => v) && _next_balance && res_last.includes(_next_balance)) {
                  balance = { ...balance, desc: prev_balance.desc };
                }
              }
            }
          }
        }
        if (page_index !== prev_page_index && page_index > prev_page_index && page_index - prev_page_index === 1 && prev_page_index > -1) {
          if (!Utils.empty(prev_balance.desc) && !Utils.empty(balance.desc) && Utils.convert_to_number(balance.desc) === Utils.convert_to_number(prev_balance.desc)) {
            payment ? payment.desc = "" : null;
            deposit ? deposit.desc = "" : null;
          }
          if (!Utils.empty(balance.desc) && Utils.convert_to_number(balance.desc) === 0 && next_balance && !Utils.empty(next_balance.desc)) {
            if (Utils.convert_to_number(payment.desc) === Utils.convert_to_number(prev_balance.desc)) {
              if (Utils.isMainRecipe([payment.desc, next_payment.desc, next_deposit.desc, next_balance.desc])) {
                balance = { ...payment };
                payment ? payment.desc = "" : null;
                deposit ? deposit.desc = "" : null;
              }
            } else if (Utils.convert_to_number(deposit.desc) === Utils.convert_to_number(prev_balance.desc)) {
              if (Utils.isMainRecipe([deposit.desc, next_payment.desc, next_deposit.desc, next_balance.desc])) {
                balance = { ...deposit };
                payment ? payment.desc = "" : null;
                deposit ? deposit.desc = "" : null;
              }
            }

          }
        }
        // if (index > 0 && !skip) {
        //   if (balance.desc && `${balance.desc}`.length > 0 && prev_balance.desc && `${prev_balance.desc}`.length > 0) {
        //     if (Utils.convert_to_number(balance.desc) > Utils.convert_to_number(prev_balance.desc)) {
        //       if (payment.desc && Utils.regex_price.is_number(payment.desc)) {
        //         if (`${deposit.desc}`.length === 0 || (`${deposit.desc}`.length > 0 && !Utils.regex_price.is_number(deposit.desc))) {
        //           tmp_value = { ...deposit }
        //           if(tmp_value.desc) {
        //             description.desc = `${description.desc} ${tmp_value.desc}`
        //           }
        //           deposit = { ...payment }
        //           payment = {...tmp_value, desc : ''}
        //         }
        //       }
        //     } else {
        //       if (deposit.desc && Utils.regex_price.is_number(deposit.desc)) {
        //         if (`${payment.desc}`.length === 0 || (`${payment.desc}`.length > 0 && !Utils.regex_price.is_number(payment.desc))) {
        //           tmp_value = { ...payment }
        //           if(tmp_value.desc) {
        //             description.desc = `${description.desc} ${tmp_value.desc}`
        //           }
        //           payment = { ...deposit }
        //           deposit = {...tmp_value, desc : ''}
        //         }
        //       }
        //     }
        //   }
        // }
        // if(payment.desc && !Utils.regex_price.is_number(payment.desc)){
        //   // description.desc = `${description.desc} ${payment.desc}`
        //   payment.desc = Utils.convert_to_number(payment.desc)
        // }
        // if(deposit.desc && !Utils.regex_price.is_number(deposit.desc)){
        //   // description.desc = `${description.desc} ${deposit.desc}`
        //   deposit.desc = Utils.convert_to_number(deposit.desc)
        // }
        // if(balance.desc && !Utils.regex_price.is_number(balance.desc)){
        //   // description.desc = `${description.desc} ${balance.desc}`
        //   balance.desc = Utils.convert_to_number(balance.desc)
        // }

        const hasValidDesc = [payment.desc, deposit.desc, balance.desc].every(desc => desc && desc.length > 0);

        if (index === 0 && hasValidDesc) {
          const isValid = (desc) => desc && desc.startsWith('*') && /\d$/.test(desc);
          const paymentValid = isValid(payment.descOrigin);
          const depositValid = isValid(deposit.descOrigin);

          if (paymentValid && depositValid) {
            (payment.desc.length < deposit.desc.length ? payment : deposit).desc = "";
          } else {
            (!paymentValid ? payment : deposit).desc = "";
          }
        }

        payment.tmp_desc = payment.desc;
        deposit.tmp_desc = deposit.desc;
        balance.tmp_desc = balance.desc;
        n.push([date, description, payment, deposit, balance]);
        return n;
      }, []);
    }
    self.detect = (tables) => {
      const check_in_number_list = (desc, num_list) => {
        desc = (`${desc}`.match(/[\d]/g) || []).join("");
        return (desc.includes(num_list) || num_list.includes(desc))
      }
      const get_price_in_number_list = (desc, num_list) => {
        if (!desc) {
          return desc;
        }
        if (
          num_list.some((a) => {
            const skip = Utils.check_and_fix_missing_character(desc.toString(), a.toString());
            // console.log("get_price_in_number_list:", skip, desc, a);
            return skip;
          })
        ) {
          return desc;
        }
        return "";
      };
      return tables.map((line, index) => {
        let [date, description, payment, deposit, balance] = line;
        Utils.writeTable([[date, description, payment, deposit, balance]])
        let [prev_date, prev_description, prev_payment, prev_deposit, prev_balance] = index > 0 ? tables[index - 1] : [{ desc: '' }, { desc: '' }, { desc: '' }, { desc: '' }, { desc: '' }];
        let mark_number = (date.number_list || description.number_list || payment.number_list || deposit.number_list || balance.number_list || []);
        let number_list = mark_number.join("").match(/[\d]/g) || [];
        let texts = (date.texts || description.texts || payment.texts || deposit.texts || balance.texts || []);
        if (index > 0) {
          let first_line_number_list = (prev_date.number_list || prev_description.number_list || prev_payment.number_list || prev_deposit.number_list || prev_balance.number_list || []).join("").match(/[\d]/g) || [];
          [prev_date.desc, prev_payment.desc, prev_deposit.desc, prev_balance.desc].forEach(prev_desc => {
            if (`${prev_desc || ''}`.length > 0) {
              prev_desc = (`${prev_desc}`.match(/[\d]/g) || []).join("");
              first_line_number_list = first_line_number_list.join("").replace(prev_desc, "").split("");
            }
          })
          number_list.push(...first_line_number_list);
        }
        number_list = (number_list || []).join("");
        number_list = number_list.replace((`${date.desc || ''}`.match(/[\d]/g) || []).join(""), "");
        Utils.debug("number_list:", number_list, `payment:`, payment.desc, check_in_number_list(payment.desc, number_list), `deposit:`, deposit.desc, check_in_number_list(deposit.desc, number_list), `balance:`, balance.desc, check_in_number_list(balance.desc, number_list))
        !description ? description = { desc: "" } : null;
        let tmp_value;
        if (`${balance.desc || ''}`.length > 0 && `${prev_balance.tmp_desc || ''}`.length > 0) {
          if (Utils.convert_to_number(balance.desc) > Utils.convert_to_number(prev_balance.tmp_desc)) {
            if (payment.desc && Utils.regex_price.is_number(payment.desc)) {
              if (`${deposit.desc}`.length === 0 || (`${deposit.desc}`.length > 0 && !Utils.regex_price.is_number(deposit.desc))) {
                tmp_value = { ...deposit }
                if (tmp_value.desc) {
                  description.desc = `${description.desc || ''} ${tmp_value.desc || ''}`
                }
                deposit = { ...payment }
                payment = { ...tmp_value, desc: '' }
              } else if (Utils.isMainRecipe([prev_balance.tmp_desc, 0, deposit.desc, balance.desc])) {
                payment.desc = "";
              }
            }
          } else {
            Utils.debug("deposit.desc && Utils.regex_price.is_number(deposit.desc):", deposit.desc && Utils.regex_price.is_number(deposit.desc) ? "o" : "x", payment.desc)
            if (deposit.desc && Utils.regex_price.is_number(deposit.desc)) {
              if (`${payment.desc}`.length === 0 || (`${payment.desc}`.length > 0 && !Utils.regex_price.is_number(payment.desc))) {
                tmp_value = { ...payment }
                if (tmp_value.desc) {
                  description.desc = `${description.desc || ''} ${tmp_value.desc || ''}`
                }
                payment = { ...deposit }
                deposit = { ...tmp_value, desc: '' }
              } else if (Utils.isMainRecipe([prev_balance.tmp_desc, payment.desc, 0, balance.desc])) {
                deposit.desc = "";
              }
            }
          }
        }

        const list_prices = [{ type: "balance", desc: balance.desc }, { type: "payment", desc: payment.desc }, { type: "deposit", desc: deposit.desc }];
        list_prices.sort((a, b) => `${a.desc}`.length > `${b.desc}`.length ? -1 : 1)
        for (const { desc, type } of list_prices) {
          if (desc && !check_in_number_list(desc, number_list)) {
            switch (type) {
              case "balance":
                balance.desc = get_price_in_number_list(desc, mark_number);
                break;
              case "payment":
                payment.desc = get_price_in_number_list(desc, mark_number);
                break;
              case "deposit":
                deposit.desc = get_price_in_number_list(desc, mark_number);
                break;
              default:
                break;
            }
          } else if (desc) {
            number_list = number_list.replace(desc, "");
          }
        }
        Utils.writeTable([[date, description, payment, deposit, balance]]);
        if (payment.desc) {
          payment.desc = Utils.map_to_number(payment.desc)
        }
        if (deposit.desc) {
          deposit.desc = Utils.map_to_number(deposit.desc)
        }
        if (balance.desc) {
          balance.desc = Utils.map_to_number(balance.desc)
        }
        const replate_text = [date.desc, deposit.desc, payment.desc, balance.desc];
        if (date && date.bottomRightX) {
          texts = texts.filter(cell => cell.upLeftX >= (date.bottomRightX - 10));
        }
        if (balance && balance.upLeftX) {
          if (![date, description, deposit, payment, balance].some(cell => cell.description_after_balance)) {
            texts = texts.filter(cell => cell.bottomRightX <= (balance.upLeftX + 10));
          }
        }
        const text_list = texts.map(cell => cell.desc);
        const status = {
          ...Object.create(date),
          desc: "false",
          descOrigin: "false",
          nids: [],
          nid1: null,
          engineList: [],
          header_lable: "status",
          texts: [],
        };
        if (prev_balance && prev_balance.desc) {
          status.desc = Utils.isMainRecipe([
            prev_balance.desc,
            payment.desc,
            deposit.desc,
            balance.desc,
          ]).toString();
        }
        description.desc = Utils.get_description(text_list, replate_text) || description.desc;
        description.header_lable = "description";
        description.nids = Utils.find_description_ids(description, texts);
        date.desc = Utils.formar_date(date.desc);
        return [date, description, payment, deposit, balance, status].map(cell => {
          cell.desc = Utils.empty(cell.desc) ? "" : cell.desc;
          return cell;
        });
      });
    }
    self.inits();
  }
  let passbook_exec = new Passbook(pages_content, []);
  return passbook_exec.tables;
}