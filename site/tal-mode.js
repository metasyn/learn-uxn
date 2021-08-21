// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
//
// MODIFIED by Xander Johnson https://metasyn.pw for UXN

(function (mod) {
  if (typeof exports === 'object' && typeof module === 'object') {
    // CommonJS
    mod(require('../../lib/codemirror'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['../../lib/codemirror'], mod);
  }
  // Plain browser env
  else mod(CodeMirror);
}((CodeMirror) => {
  CodeMirror.defineMode('go', (config) => {
    const { indentUnit } = config;

    const stackOpCodes = [
      'BRK',
      'LIT',
      'POP',
      'DUP',
      'NIP',
      'SWP',
      'OVR',
      'ROT',
    ];
    const logicOpCodes = [
      'EQU',
      'NEQ',
      'GTH',
      'LTH',
      'JMP',
      'JCN',
      'JSR',
      'STH',
    ];
    const memoryOpCodes = [
      'LDZ',
      'STZ',
      'LDR',
      'STR',
      'LDA',
      'STA',
      'DEI',
      'DEO',
    ];

    const arithmeticOpCodes = [
      'ADD',
      'SUB',
      'MUL',
      'DIV',
      'AND',
      'ORA',
      'EOR',
      'SFT',
    ];

    const keywords = {
      // break: true
    };

    const atoms = {
      //true: true,
      //false: true,
      //print: true;
    };

    const isOperatorChar = /[+\-*&^%:=<>!|\/]/;

    let curPunc;

    function tokenBase(stream, state) {
      const ch = stream.next();
      if (ch === '"' || ch === "'" || ch === '`') {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      if (/[\d\.]/.test(ch)) {
        if (ch == '.') {
          stream.match(/^[0-9]+([eE][\-+]?[0-9]+)?/);
        } else if (ch == '0') {
          stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^0[0-7]+/);
        } else {
          stream.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/);
        }
        return 'number';
      }
      if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
        curPunc = ch;
        return null;
      }
      if (ch == '(') {
        if (stream.eat('*')) {
          state.tokenize = tokenComment;
          return tokenComment(stream, state);
        }
        if (stream.eat(')')) {
          stream.skipToEnd();
          return 'comment';
        }
      }
      if (isOperatorChar.test(ch)) {
        stream.eatWhile(isOperatorChar);
        return 'operator';
      }
      stream.eatWhile(/[\w\$_\xa1-\uffff]/);
      const cur = stream.current();
      if (keywords.propertyIsEnumerable(cur)) {
        if (cur == 'case' || cur == 'default') curPunc = 'case';
        return 'keyword';
      }
      if (atoms.propertyIsEnumerable(cur)) return 'atom';
      return 'variable';
    }

    function tokenString(quote) {
      return function (stream, state) {
        let escaped = false;
        let next;
        let end = false;
        while ((next = stream.next()) != null) {
          if (next == quote && !escaped) {
            end = true;
            break;
          }
          escaped = !escaped && quote != '`' && next == '\\';
        }
        if (end || !(escaped || quote == '`')) state.tokenize = tokenBase;
        return 'string';
      };
    }

    function tokenComment(stream, state) {
      let ch;
      while ((ch = stream.next())) {
        if (ch == ')') {
          state.tokenize = tokenBase;
          break;
        }
      }
      return 'comment';
    }

    function Context(indented, column, type, align, prev) {
      this.indented = indented;
      this.column = column;
      this.type = type;
      this.align = align;
      this.prev = prev;
    }
    function pushContext(state, col, type) {
      return (state.context = new Context(
        state.indented,
        col,
        type,
        null,
        state.context,
      ));
    }
    function popContext(state) {
      if (!state.context.prev) return;
      const t = state.context.type;
      if (t == ')' || t == ']' || t == '}') state.indented = state.context.indented;
      return (state.context = state.context.prev);
    }

    // Interface

    return {
      startState(basecolumn) {
        return {
          tokenize: null,
          context: new Context((basecolumn || 0) - indentUnit, 0, 'top', false),
          indented: 0,
          startOfLine: true,
        };
      },

      token(stream, state) {
        const ctx = state.context;
        if (stream.sol()) {
          if (ctx.align == null) ctx.align = false;
          state.indented = stream.indentation();
          state.startOfLine = true;
          if (ctx.type == 'case') ctx.type = '}';
        }
        if (stream.eatSpace()) return null;
        curPunc = null;
        const style = (state.tokenize || tokenBase)(stream, state);
        if (style == 'comment') return style;
        if (ctx.align == null) ctx.align = true;

        if (curPunc == '{') pushContext(state, stream.column(), '}');
        else if (curPunc == '[') pushContext(state, stream.column(), ']');
        else if (curPunc == '(') pushContext(state, stream.column(), ')');
        else if (curPunc == 'case') ctx.type = 'case';
        else if (curPunc == '}' && ctx.type == '}') popContext(state);
        else if (curPunc == ctx.type) popContext(state);
        state.startOfLine = false;
        return style;
      },

      indent(state, textAfter) {
        if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
        const ctx = state.context;
        const firstChar = textAfter && textAfter.charAt(0);
        if (ctx.type == 'case' && /^(?:case|default)\b/.test(textAfter)) {
          state.context.type = '}';
          return ctx.indented;
        }
        const closing = firstChar == ctx.type;
        if (ctx.align) return ctx.column + (closing ? 0 : 1);
        return ctx.indented + (closing ? 0 : indentUnit);
      },

      electricChars: '{}):',
      closeBrackets: "()[]{}''\"\"``",
      fold: 'brace',
      blockCommentStart: '/*',
      blockCommentEnd: '*/',
      lineComment: '//',
    };
  });

  CodeMirror.defineMIME('text/x-tal', 'tal');
}));
