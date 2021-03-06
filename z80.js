(function() {

  window.JSSpeccy.Z80 = function(opts) {
    var ADC_A, ADD_A, ADD_RR_RR, AND_A, BIT_N_R, BIT_N_iHLi, BIT_N_iRRpNNi, CALL_C_NN, CALL_NN, CCF, CPDR, CPIR, CPL, CP_A, DEC, DEC_RR, DI, DJNZ_N, EI, EXX, EX_RR_RR, EX_iSPi_RR, FLAG_3, FLAG_5, FLAG_C, FLAG_H, FLAG_N, FLAG_P, FLAG_S, FLAG_V, FLAG_Z, HALT, IM, INC, INC_RR, IN_A_N, IN_R_iCi, JP_C_NN, JP_NN, JP_RR, JR_C_N, JR_N, LDDR, LDI, LDIR, LD_A_iNNi, LD_RR_NN, LD_RR_RR, LD_RR_iNNi, LD_R_N, LD_R_R, LD_R_iRRi, LD_R_iRRpNNi, LD_iNNi_A, LD_iNNi_RR, LD_iRRi_N, LD_iRRi_R, LD_iRRpNNi_N, LD_iRRpNNi_R, NEG, NOP, OPCODE_RUNNERS, OPCODE_RUNNERS_CB, OPCODE_RUNNERS_DD, OPCODE_RUNNERS_DDCB, OPCODE_RUNNERS_ED, OPCODE_RUNNERS_FD, OPCODE_RUNNERS_FDCB, OPCODE_RUN_STRINGS, OPCODE_RUN_STRINGS_CB, OPCODE_RUN_STRINGS_DD, OPCODE_RUN_STRINGS_DDCB, OPCODE_RUN_STRINGS_ED, OPCODE_RUN_STRINGS_FD, OPCODE_RUN_STRINGS_FDCB, OR_A, OUT_iCi_R, OUT_iNi_A, POP_RR, PUSH_RR, RES, RET, RET_C, RL, RLA, RLC, RLCA, RR, RRA, RRC, RRCA, RST, SBC_A, SBC_HL_RR, SCF, SET, SHIFT, SLA, SRA, SRL, SUB_A, XOR_A, buildRunnerFunctions, display, generateddfdOpcodeSet, generateddfdcbOpcodeSet, getParamBoilerplate, halfcarryAddTable, halfcarrySubTable, halted, iff1, iff2, im, interruptPending, interruptible, ioBus, memory, opcodePrefix, opcodeSwitch, overflowAddTable, overflowSubTable, parityTable, rA, rA_, rB, rB_, rC, rC_, rD, rD_, rE, rE_, rF, rF_, rH, rH_, rI, rIXH, rIXL, rIYH, rIYL, rL, rL_, rR, regPairs, registerBuffer, regs, rpAF, rpAF_, rpBC, rpBC_, rpDE, rpDE_, rpHL, rpHL_, rpIR, rpIX, rpIY, rpPC, rpSP, self, sz53Table, sz53pTable, tstates, z80InitTables, z80Interrupt;
    self = {};
    memory = opts.memory;
    ioBus = opts.ioBus;
    display = opts.display;
    rpAF = 0;
    rpBC = 1;
    rpDE = 2;
    rpHL = 3;
    rpAF_ = 4;
    rpBC_ = 5;
    rpDE_ = 6;
    rpHL_ = 7;
    rpIX = 8;
    rpIY = 9;
    rpIR = 10;
    rpSP = 11;
    rpPC = 12;
    registerBuffer = new ArrayBuffer(26);
    regPairs = new Uint16Array(registerBuffer);
    regs = new Uint8Array(registerBuffer);
    /*
    	Typed arrays are native-endian
    	(http://lists.w3.org/Archives/Public/public-script-coord/2010AprJun/0048.html, 
    	http://cat-in-136.blogspot.com/2011/03/javascript-typed-array-use-native.html)
    	so need to test endianness in order to know the offsets of individual registers
    */
    regPairs[rpAF] = 0x0100;
    if (regs[0] === 0x01) {
      rA = 0;
      rF = 1;
      rB = 2;
      rC = 3;
      rD = 4;
      rE = 5;
      rH = 6;
      rL = 7;
      rA_ = 8;
      rF_ = 9;
      rB_ = 10;
      rC_ = 11;
      rD_ = 12;
      rE_ = 13;
      rH_ = 14;
      rL_ = 15;
      rIXH = 16;
      rIXL = 17;
      rIYH = 18;
      rIYL = 19;
      rI = 20;
      rR = 21;
    } else {
      rF = 0;
      rA = 1;
      rC = 2;
      rB = 3;
      rE = 4;
      rD = 5;
      rL = 6;
      rH = 7;
      rF_ = 8;
      rA_ = 9;
      rC_ = 10;
      rB_ = 11;
      rE_ = 12;
      rD_ = 13;
      rL_ = 14;
      rH_ = 15;
      rIXL = 16;
      rIXH = 17;
      rIYL = 18;
      rIYH = 19;
      rR = 20;
      rI = 21;
    }
    tstates = 0;
    iff1 = iff2 = im = 0;
    halted = false;
    FLAG_C = 0x01;
    FLAG_N = 0x02;
    FLAG_P = 0x04;
    FLAG_V = 0x04;
    FLAG_3 = 0x08;
    FLAG_H = 0x10;
    FLAG_5 = 0x10;
    FLAG_Z = 0x40;
    FLAG_S = 0x80;
    /*
    		Whether a half carry occurred or not can be determined by looking at
    		the 3rd bit of the two arguments and the result; these are hashed
    		into this table in the form r12, where r is the 3rd bit of the
    		result, 1 is the 3rd bit of the 1st argument and 2 is the
    		third bit of the 2nd argument; the tables differ for add and subtract
    		operations
    */
    halfcarryAddTable = new Uint8Array([0, FLAG_H, FLAG_H, FLAG_H, 0, 0, 0, FLAG_H]);
    halfcarrySubTable = new Uint8Array([0, 0, FLAG_H, 0, FLAG_H, 0, FLAG_H, FLAG_H]);
    overflowAddTable = new Uint8Array([0, 0, 0, FLAG_V, FLAG_V, 0, 0, 0]);
    overflowSubTable = new Uint8Array([0, FLAG_V, 0, 0, 0, 0, FLAG_V, 0]);
    sz53Table = new Uint8Array(0x100);
    parityTable = new Uint8Array(0x100);
    sz53pTable = new Uint8Array(0x100);
    z80InitTables = function() {
      var i, j, k, parity;
      for (i = 0; 0 <= 0x100 ? i < 0x100 : i > 0x100; 0 <= 0x100 ? i++ : i--) {
        sz53Table[i] = i & (FLAG_3 | FLAG_5 | FLAG_S);
        j = i;
        parity = 0;
        for (k = 0; k < 8; k++) {
          parity ^= j & 1;
          j >>= 1;
        }
        parityTable[i] = parity ? 0 : FLAG_P;
        sz53pTable[i] = sz53Table[i] | parityTable[i];
      }
      sz53Table[0] |= FLAG_Z;
      return sz53pTable[0] |= FLAG_Z;
    };
    z80InitTables();
    /*
    		Boilerplate generator: a helper to deal with classes of opcodes which perform
    		the same task on different types of operands: e.g. XOR B, XOR (HL), XOR nn, XOR (IX+nn).
    		This function accepts the parameter in question, and returns a set of canned strings
    		for use in the opcode runner body:
    		'getter': a block of code that performs any necessary memory access etc in order to
    			make 'v' a valid expression;
    		'v': an expression with no side effects, evaluating to the operand's value. (Must also be a valid lvalue for assignment)
    		'trunc': an expression such as '& 0xff' to truncate v back to its proper range, if appropriate
    		'setter': a block of code that writes an updated value back to its proper location, if any
    		
    		Passing hasIXOffsetAlready = true indicates that we have already read the offset value of (IX+nn)/(IY+nn)
    		into a variable 'offset' (necessary because DDCB/FFCB instructions put this before the final opcode byte).
    */
    getParamBoilerplate = function(param, hasIXOffsetAlready) {
      var getter, match, rp;
      if (hasIXOffsetAlready == null) hasIXOffsetAlready = false;
      if (param.match(/^[AFBCDEHL]|I[XY][HL]$/)) {
        return {
          'getter': '',
          'v': "regs[r" + param + "]",
          'trunc': '',
          'setter': ''
        };
      } else if (param === '(HL)') {
        return {
          'getter': "var val = memory.read(regPairs[" + rpHL + "]); tstates += 3;",
          'v': 'val',
          'trunc': '& 0xff',
          'setter': "memory.write(regPairs[" + rpHL + "], val); tstates += 4;"
        };
      } else if (param === 'nn') {
        return {
          'getter': "var val = memory.read(regPairs[" + rpPC + "]++); tstates += 3;",
          'v': 'val',
          'trunc': '& 0xff',
          'setter': ''
        };
      } else if ((match = param.match(/^\((I[XY])\+nn\)$/))) {
        rp = "rp" + match[1];
        if (hasIXOffsetAlready) {
          getter = '';
        } else {
          getter = "var offset = memory.read(regPairs[" + rpPC + "]++);\nif (offset & 0x80) offset -= 0x100;";
        }
        getter += "var addr = (regPairs[" + rp + "] + offset) & 0xffff;\nvar val = memory.read( addr );\ntstates += 11;";
        return {
          'getter': getter,
          'v': 'val',
          'trunc': '& 0xff',
          'setter': "memory.write(addr, val); tstates += 4;"
        };
      } else {
        throw "Unknown param format: " + param;
      }
    };
    /*
    		Opcode generator functions: each returns a string of Javascript that performs the opcode
    		when executed within this module's scope. Note that instructions with DDCBnn opcodes also
    		require an 'offset' variable to be defined as nn (as a signed byte).
    */
    ADC_A = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\n\nvar adctemp = regs[rA] + " + operand.v + " + (regs[rF] & FLAG_C);\nvar lookup = ( (regs[rA] & 0x88) >> 3 ) | ( (" + operand.v + " & 0x88) >> 2 ) | ( (adctemp & 0x88) >> 1 );\nregs[rA] = adctemp;\nregs[rF] = ( adctemp & 0x100 ? FLAG_C : 0 ) | halfcarryAddTable[lookup & 0x07] | overflowAddTable[lookup >> 4] | sz53Table[regs[rA]];";
    };
    ADD_A = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\n\nvar addtemp = regs[rA] + " + operand.v + ";\nvar lookup = ( (regs[rA] & 0x88) >> 3 ) | ( (" + operand.v + " & 0x88) >> 2 ) | ( (addtemp & 0x88) >> 1 );\nregs[rA] = addtemp;\nregs[rF] = ( addtemp & 0x100 ? FLAG_C : 0 ) | halfcarryAddTable[lookup & 0x07] | overflowAddTable[lookup >> 4] | sz53Table[regs[rA]];";
    };
    ADD_RR_RR = function(rp1, rp2) {
      return "var add16temp = regPairs[" + rp1 + "] + regPairs[" + rp2 + "];\nvar lookup = ( (regPairs[" + rp1 + "] & 0x0800) >> 11 ) | ( (regPairs[" + rp2 + "] & 0x0800) >> 10 ) | ( (add16temp & 0x0800) >>  9 );\nregPairs[" + rp1 + "] = add16temp;\nregs[rF] = ( regs[rF] & ( FLAG_V | FLAG_Z | FLAG_S ) ) | ( add16temp & 0x10000 ? FLAG_C : 0 ) | ( ( add16temp >> 8 ) & ( FLAG_3 | FLAG_5 ) ) | halfcarryAddTable[lookup];\ntstates += 7;";
    };
    AND_A = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\n\nregs[rA] &= " + operand.v + ";\nregs[rF] = FLAG_H | sz53pTable[regs[rA]];";
    };
    BIT_N_iRRpNNi = function(bit, rp) {
      return "var addr = (regPairs[" + rp + "] + offset) & 0xffff;\nvar value = memory.read(addr);\nregs[rF] = ( regs[rF] & FLAG_C ) | FLAG_H | ( ( addr >> 8 ) & ( FLAG_3 | FLAG_5 ) );\nif( ! ( (value) & ( 0x01 << (" + bit + ") ) ) ) regs[rF] |= FLAG_P | FLAG_Z;\nif( (" + bit + ") == 7 && (value) & 0x80 ) regs[rF] |= FLAG_S;\ntstates += 12;";
    };
    BIT_N_iHLi = function(bit) {
      return "var addr = regPairs[rpHL];\nvar value = memory.read(addr);\nregs[rF] = ( regs[rF] & FLAG_C ) | FLAG_H | ( value & ( FLAG_3 | FLAG_5 ) );\nif( ! ( (value) & ( 0x01 << (" + bit + ") ) ) ) regs[rF] |= FLAG_P | FLAG_Z;\nif( (" + bit + ") == 7 && (value) & 0x80 ) regs[rF] |= FLAG_S;\ntstates += 4;";
    };
    BIT_N_R = function(bit, r) {
      return "regs[rF] = ( regs[rF] & FLAG_C ) | FLAG_H | ( regs[" + r + "] & ( FLAG_3 | FLAG_5 ) );\nif( ! ( regs[" + r + "] & ( 0x01 << (" + bit + ") ) ) ) regs[rF] |= FLAG_P | FLAG_Z;\nif( (" + bit + ") == 7 && regs[" + r + "] & 0x80 ) regs[rF] |= FLAG_S;";
    };
    CALL_C_NN = function(flag, sense) {
      if (sense) {
        return "if (regs[rF] & " + flag + ") {\n	var l = memory.read(regPairs[rpPC]++);\n	var h = memory.read(regPairs[rpPC]++);\n	memory.write(--regPairs[rpSP], regPairs[rpPC] >> 8);\n	memory.write(--regPairs[rpSP], regPairs[rpPC] & 0xff);\n	regPairs[rpPC] = (h<<8) | l;\n	tstates += 13;\n} else {\n	regPairs[rpPC] += 2; /* skip past address bytes */\n	tstates += 6;\n}";
      } else {
        return "if (regs[rF] & " + flag + ") {\n	regPairs[rpPC] += 2; /* skip past address bytes */\n	tstates += 6;\n} else {\n	var l = memory.read(regPairs[rpPC]++);\n	var h = memory.read(regPairs[rpPC]++);\n	memory.write(--regPairs[rpSP], regPairs[rpPC] >> 8);\n	memory.write(--regPairs[rpSP], regPairs[rpPC] & 0xff);\n	regPairs[rpPC] = (h<<8) | l;\n	tstates += 13;\n}";
      }
    };
    CALL_NN = function() {
      return "var l = memory.read(regPairs[rpPC]++);\nvar h = memory.read(regPairs[rpPC]++);\nmemory.write(--regPairs[rpSP], regPairs[rpPC] >> 8);\nmemory.write(--regPairs[rpSP], regPairs[rpPC] & 0xff);\nregPairs[rpPC] = (h<<8) | l;\ntstates += 13;";
    };
    CCF = function() {
      return "regs[rF] = ( regs[rF] & (FLAG_P | FLAG_Z | FLAG_S) ) | ( (regs[rF] & FLAG_C) ? FLAG_H : FLAG_C ) | ( regs[rA] & (FLAG_3 | FLAG_5) );";
    };
    CP_A = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\n\nvar cptemp = regs[rA] - " + operand.v + ";\nvar lookup = ( (regs[rA] & 0x88) >> 3 ) | ( (" + operand.v + " & 0x88) >> 2 ) | ( (cptemp & 0x88) >> 1 );\nregs[rF] = ( cptemp & 0x100 ? FLAG_C : ( cptemp ? 0 : FLAG_Z ) ) | FLAG_N | halfcarrySubTable[lookup & 0x07] | overflowSubTable[lookup >> 4] | ( " + operand.v + " & ( FLAG_3 | FLAG_5 ) ) | ( cptemp & FLAG_S );";
    };
    CPDR = function() {
      return "var value = memory.read(regPairs[rpHL]);\nvar bytetemp = (regs[rA] - value) & 0xff;\nvar lookup = ( (regs[rA] & 0x08) >> 3 ) | ( (value & 0x08) >> 2 ) | ( (bytetemp & 0x08) >> 1 );\nregPairs[rpBC]--;\nregs[rF] = (regs[rF] & FLAG_C) | ( regPairs[rpBC] ? (FLAG_V | FLAG_N) : FLAG_N ) | halfcarrySubTable[lookup] | (bytetemp ? 0 : FLAG_Z) | (bytetemp & FLAG_S);\nif (regs[rF] & FLAG_H) bytetemp--;\nregs[rF] |= (bytetemp & FLAG_3) | ( (bytetemp & 0x02) ? FLAG_5 : 0 );\nif( ( regs[rF] & (FLAG_V | FLAG_Z) ) == FLAG_V ) {\n	regPairs[rpPC] -= 2;\n	tstates += 5;\n}\nregPairs[rpHL]--;\ntstates += 8;";
    };
    CPIR = function() {
      return "var value = memory.read(regPairs[rpHL]);\nvar bytetemp = (regs[rA] - value) & 0xff;\nvar lookup = ( (regs[rA] & 0x08) >> 3 ) | ( (value & 0x08) >> 2 ) | ( (bytetemp & 0x08) >> 1 );\nregPairs[rpBC]--;\nregs[rF] = (regs[rF] & FLAG_C) | ( regPairs[rpBC] ? (FLAG_V | FLAG_N) : FLAG_N ) | halfcarrySubTable[lookup] | (bytetemp ? 0 : FLAG_Z) | (bytetemp & FLAG_S);\nif (regs[rF] & FLAG_H) bytetemp--;\nregs[rF] |= (bytetemp & FLAG_3) | ( (bytetemp & 0x02) ? FLAG_5 : 0 );\nif( ( regs[rF] & (FLAG_V | FLAG_Z) ) == FLAG_V ) {\n	regPairs[rpPC] -= 2;\n	tstates += 5;\n}\nregPairs[rpHL]++;\ntstates += 8;";
    };
    CPL = function() {
      return "regs[rA] ^= 0xff;\nregs[rF] = ( regs[rF] & (FLAG_C | FLAG_P | FLAG_Z | FLAG_S) ) | ( regs[rA] & (FLAG_3 | FLAG_5) ) | (FLAG_N | FLAG_H);";
    };
    DEC = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\n\nregs[rF] = (regs[rF] & FLAG_C ) | ( " + operand.v + " & 0x0f ? 0 : FLAG_H ) | FLAG_N;\n" + operand.v + " = (" + operand.v + " - 1) " + operand.trunc + ";\n\n" + operand.setter + "\nregs[rF] |= (" + operand.v + " == 0x7f ? FLAG_V : 0) | sz53Table[" + operand.v + "];";
    };
    DEC_RR = function(rp) {
      return "regPairs[" + rp + "]--;\ntstates += 2;";
    };
    DI = function() {
      return "iff1 = iff2 = 0;";
    };
    DJNZ_N = function() {
      return "regs[rB]--;\nif (regs[rB]) {\n	/* take branch */\n	var offset = memory.read(regPairs[rpPC]++);\n	regPairs[rpPC] += (offset & 0x80 ? offset - 0x100 : offset);\n	tstates += 9;\n} else {\n	/* do not take branch */\n	regPairs[rpPC]++; /* skip past offset byte */\n	tstates += 4;\n}";
    };
    EI = function() {
      return "iff1 = iff2 = 1;\ninterruptible = false;";
    };
    EX_iSPi_RR = function(rp) {
      return "var l = memory.read(regPairs[rpSP]);\nvar h = memory.read((regPairs[rpSP] + 1) & 0xffff);\nmemory.write(regPairs[rpSP], regPairs[" + rp + "] & 0xff);\nmemory.write((regPairs[rpSP] + 1) & 0xffff, regPairs[" + rp + "] >> 8);\nregPairs[" + rp + "] = (h<<8) | l;\ntstates += 15;";
    };
    EX_RR_RR = function(rp1, rp2) {
      return "var temp = regPairs[" + rp1 + "];\nregPairs[" + rp1 + "] = regPairs[" + rp2 + "];\nregPairs[" + rp2 + "] = temp;";
    };
    EXX = function() {
      return "var wordtemp;\nwordtemp = regPairs[rpBC]; regPairs[rpBC] = regPairs[rpBC_]; regPairs[rpBC_] = wordtemp;\nwordtemp = regPairs[rpDE]; regPairs[rpDE] = regPairs[rpDE_]; regPairs[rpDE_] = wordtemp;\nwordtemp = regPairs[rpHL]; regPairs[rpHL] = regPairs[rpHL_]; regPairs[rpHL_] = wordtemp;";
    };
    HALT = function() {
      return "halted = true;\nregPairs[rpPC]--;";
    };
    IM = function(val) {
      return "im = " + val + ";";
    };
    IN_A_N = function() {
      return "var val = memory.read(regPairs[rpPC]++);\nregs[rA] = ioBus.read( (regs[rA] << 8) | val );\ntstates += 7;";
    };
    IN_R_iCi = function(r) {
      return "regs[" + r + "] = ioBus.read(regPairs[rpBC]);\nregs[rF] = (regs[rF] & FLAG_C) | sz53pTable[regs[" + r + "]];\ntstates += 4;";
    };
    INC = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\n\nregs[rF] = (regs[rF] & FLAG_C ) | ( " + operand.v + " & 0x0f ? 0 : FLAG_H ) | FLAG_N;\n" + operand.v + " = (" + operand.v + " + 1) " + operand.trunc + ";\n\n" + operand.setter + "\nregs[rF] = (regs[rF] & FLAG_C) | ( " + operand.v + " == 0x80 ? FLAG_V : 0 ) | ( " + operand.v + " & 0x0f ? 0 : FLAG_H ) | sz53Table[" + operand.v + "];\ntstates += 7;";
    };
    INC_RR = function(rp) {
      return "regPairs[" + rp + "]++;\ntstates += 2;";
    };
    JP_C_NN = function(flag, sense) {
      if (sense) {
        return "if (regs[rF] & " + flag + ") {\n	var l = memory.read(regPairs[rpPC]++);\n	var h = memory.read(regPairs[rpPC]++);\n	regPairs[rpPC] = (h<<8) | l;\n} else {\n	regPairs[rpPC] += 2; /* skip past address bytes */\n}\ntstates += 6;";
      } else {
        return "if (regs[rF] & " + flag + ") {\n	regPairs[rpPC] += 2; /* skip past address bytes */\n} else {\n	var l = memory.read(regPairs[rpPC]++);\n	var h = memory.read(regPairs[rpPC]++);\n	regPairs[rpPC] = (h<<8) | l;\n}\ntstates += 6;";
      }
    };
    JP_RR = function(rp) {
      return "regPairs[rpPC] = regPairs[" + rp + "];";
    };
    JP_NN = function() {
      return "var l = memory.read(regPairs[rpPC]++);\nvar h = memory.read(regPairs[rpPC]++);\nregPairs[rpPC] = (h<<8) | l;\ntstates += 6;";
    };
    JR_C_N = function(flag, sense) {
      if (sense) {
        return "if (regs[rF] & " + flag + ") {\n	var offset = memory.read(regPairs[rpPC]++);\n	regPairs[rpPC] += (offset & 0x80 ? offset - 0x100 : offset);\n	tstates += 8;\n} else {\n	regPairs[rpPC]++; /* skip past offset byte */\n	tstates += 3;\n}";
      } else {
        return "if (regs[rF] & " + flag + ") {\n	regPairs[rpPC]++; /* skip past offset byte */\n	tstates += 3;\n} else {\n	var offset = memory.read(regPairs[rpPC]++);\n	regPairs[rpPC] += (offset & 0x80 ? offset - 0x100 : offset);\n	tstates += 8;\n}";
      }
    };
    JR_N = function() {
      return "var offset = memory.read(regPairs[rpPC]++);\nregPairs[rpPC] += (offset & 0x80 ? offset - 0x100 : offset);\ntstates += 8;";
    };
    LD_A_iNNi = function() {
      return "var l = memory.read(regPairs[rpPC]++);\nvar h = memory.read(regPairs[rpPC]++);\nvar addr = (h<<8) | l;\nregs[rA] = memory.read(addr);\ntstates += 9;";
    };
    LD_iNNi_A = function() {
      return "var l = memory.read(regPairs[rpPC]++);\nvar h = memory.read(regPairs[rpPC]++);\nvar addr = (h<<8) | l;\nmemory.write(addr, regs[rA]);\ntstates += 9;";
    };
    LD_iNNi_RR = function(rp) {
      return "var l = memory.read(regPairs[rpPC]++);\nvar h = memory.read(regPairs[rpPC]++);\nvar addr = (h<<8) | l;\nmemory.write(addr, regPairs[" + rp + "] & 0xff);\nmemory.write((addr + 1) & 0xffff, regPairs[" + rp + "] >> 8);\ntstates += 12;";
    };
    LD_iRRi_N = function(rp) {
      return "var n = memory.read(regPairs[rpPC]++);\nmemory.write(regPairs[" + rp + "], n);\ntstates += 6;";
    };
    LD_iRRi_R = function(rp, r) {
      return "memory.write(regPairs[" + rp + "], regs[" + r + "]);\ntstates += 3;";
    };
    LD_iRRpNNi_N = function(rp) {
      return "var offset = memory.read(regPairs[rpPC]++);\nif (offset & 0x80) offset -= 0x100;\nvar addr = (regPairs[" + rp + "] + offset) & 0xffff;\n\nvar val = memory.read(regPairs[rpPC]++);\nmemory.write(addr, val);\ntstates += 11;";
    };
    LD_iRRpNNi_R = function(rp, r) {
      return "var offset = memory.read(regPairs[rpPC]++);\nif (offset & 0x80) offset -= 0x100;\nvar addr = (regPairs[" + rp + "] + offset) & 0xffff;\n\nmemory.write(addr, regs[" + r + "]);\ntstates += 11;";
    };
    LD_R_iRRi = function(r, rp) {
      return "regs[" + r + "] = memory.read(regPairs[" + rp + "]);\ntstates += 3;";
    };
    LD_R_iRRpNNi = function(r, rp) {
      return "var offset = memory.read(regPairs[rpPC]++);\nif (offset & 0x80) offset -= 0x100;\nvar addr = (regPairs[" + rp + "] + offset) & 0xffff;\n\nregs[" + r + "] = memory.read(addr);\ntstates += 11;";
    };
    LD_R_N = function(r) {
      return "regs[" + r + "] = memory.read(regPairs[rpPC]++);\ntstates += 3;";
    };
    LD_R_R = function(r1, r2) {
      if (r1 === rI || r2 === rI || r1 === rR || r2 === rR) {
        return "regs[" + r1 + "] = regs[" + r2 + "];\ntstates += 1;";
      } else {
        return "regs[" + r1 + "] = regs[" + r2 + "];";
      }
    };
    LD_RR_iNNi = function(rp, shifted) {
      return "var l = memory.read(regPairs[rpPC]++);\nvar h = memory.read(regPairs[rpPC]++);\nvar addr = (h<<8) | l;\nl = memory.read(addr);\nh = memory.read((addr + 1) & 0xffff);\nregPairs[" + rp + "] = (h<<8) | l;\ntstates += 12;";
    };
    LD_RR_NN = function(rp) {
      return "var l = memory.read(regPairs[rpPC]++);\nvar h = memory.read(regPairs[rpPC]++);\nregPairs[" + rp + "] = (h<<8) | l;\ntstates += 6;";
    };
    LD_RR_RR = function(rp1, rp2) {
      return "regPairs[" + rp1 + "] = regPairs[" + rp2 + "];\ntstates += 2;";
    };
    LDDR = function() {
      return "var bytetemp = memory.read(regPairs[rpHL]);\nmemory.write(regPairs[rpDE],bytetemp);\nregPairs[rpBC]--;\nbytetemp = (bytetemp + regs[rA]) & 0xff;\nregs[rF] = ( regs[rF] & ( FLAG_C | FLAG_Z | FLAG_S ) ) | ( regPairs[rpBC] ? FLAG_V : 0 ) | ( bytetemp & FLAG_3 ) | ( (bytetemp & 0x02) ? FLAG_5 : 0 );\nif (regPairs[rpBC]) {\n	regPairs[rpPC]-=2;\n	tstates += 13;\n} else {\n	tstates += 8;\n}\nregPairs[rpHL]--; regPairs[rpDE]--;";
    };
    LDI = function() {
      return "var bytetemp = memory.read(regPairs[rpHL]);\nregPairs[rpBC]--;\nmemory.write(regPairs[rpDE],bytetemp);\nregPairs[rpDE]++; regPairs[rpHL]++;\nbytetemp = (bytetemp + regs[rA]) & 0xff;\nregs[rF] = ( regs[rF] & (FLAG_C | FLAG_Z | FLAG_S) ) | ( regPairs[rpBC] ? FLAG_V : 0 ) | (bytetemp & FLAG_3) | ( (bytetemp & 0x02) ? FLAG_5 : 0 );\ntstates += 8;";
    };
    LDIR = function() {
      return "var bytetemp = memory.read(regPairs[rpHL]);\nmemory.write(regPairs[rpDE],bytetemp);\nregPairs[rpBC]--;\nbytetemp = (bytetemp + regs[rA]) & 0xff;\nregs[rF] = ( regs[rF] & ( FLAG_C | FLAG_Z | FLAG_S ) ) | ( regPairs[rpBC] ? FLAG_V : 0 ) | ( bytetemp & FLAG_3 ) | ( (bytetemp & 0x02) ? FLAG_5 : 0 );\nif (regPairs[rpBC]) {\n	regPairs[rpPC]-=2;\n	tstates += 13;\n} else {\n	tstates += 8;\n}\nregPairs[rpHL]++; regPairs[rpDE]++;";
    };
    NEG = function() {
      return "var val = regs[rA];\nvar subtemp = -val;\nvar lookup = ( (val & 0x88) >> 2 ) | ( (subtemp & 0x88) >> 1 );\nregs[rA] = subtemp;\nregs[rF] = ( subtemp & 0x100 ? FLAG_C : 0 ) | FLAG_N | halfcarrySubTable[lookup & 0x07] | overflowSubTable[lookup >> 4] | sz53Table[regs[rA]];";
    };
    NOP = function() {
      return "";
    };
    OR_A = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\n\nregs[rA] |= " + operand.v + ";\nregs[rF] = sz53pTable[regs[rA]];";
    };
    OUT_iCi_R = function(r) {
      return "ioBus.write(regPairs[rpBC], regs[" + r + "]);\ntstates += 4;";
    };
    OUT_iNi_A = function() {
      return "var port = memory.read(regPairs[rpPC]++);\nioBus.write( (regs[rA] << 8) | port, regs[rA]);\ntstates += 7;";
    };
    POP_RR = function(rp) {
      return "var l = memory.read(regPairs[rpSP]++);\nvar h = memory.read(regPairs[rpSP]++);\nregPairs[" + rp + "] = (h<<8) | l;\ntstates += 6;";
    };
    PUSH_RR = function(rp) {
      return "memory.write(--regPairs[rpSP], regPairs[" + rp + "] >> 8);\nmemory.write(--regPairs[rpSP], regPairs[" + rp + "] & 0xff);\ntstates += 7;";
    };
    RES = function(bit, param) {
      var hexMask, operand;
      operand = getParamBoilerplate(param, true);
      hexMask = 0xff ^ (1 << bit);
      return "" + operand.getter + "\n" + operand.v + " &= " + hexMask + ";\n" + operand.setter;
    };
    RET = function() {
      return "var l = memory.read(regPairs[rpSP]++);\nvar h = memory.read(regPairs[rpSP]++);\nregPairs[rpPC] = (h<<8) | l;\ntstates += 6;";
    };
    RET_C = function(flag, sense) {
      if (sense) {
        return "if (regs[rF] & " + flag + ") {\n	var l = memory.read(regPairs[rpSP]++);\n	var h = memory.read(regPairs[rpSP]++);\n	regPairs[rpPC] = (h<<8) | l;\n	tstates += 7;\n} else {\n	tstates += 1;\n}";
      } else {
        return "if (regs[rF] & " + flag + ") {\n	tstates += 1;\n} else {\n	var l = memory.read(regPairs[rpSP]++);\n	var h = memory.read(regPairs[rpSP]++);\n	regPairs[rpPC] = (h<<8) | l;\n	tstates += 7;\n}";
      }
    };
    RL = function(param) {
      var operand;
      operand = getParamBoilerplate(param, true);
      return "" + operand.getter + "\nvar rltemp = " + operand.v + ";\n" + operand.v + " = ( (" + operand.v + " << 1) | (regs[rF] & FLAG_C) ) " + operand.trunc + ";\nregs[rF] = ( rltemp >> 7 ) | sz53pTable[" + operand.v + "];\n" + operand.setter;
    };
    RLA = function() {
      return "var bytetemp = regs[rA];\nregs[rA] = (regs[rA] << 1) | (regs[rF] & FLAG_C);\nregs[rF] = ( regs[rF] & (FLAG_P | FLAG_Z | FLAG_S) ) | ( regs[rA] & (FLAG_3 | FLAG_5) ) | (bytetemp >> 7);";
    };
    RLC = function(param) {
      var operand;
      operand = getParamBoilerplate(param, true);
      return "" + operand.getter + "\n" + operand.v + " = ( (" + operand.v + " << 1) | (" + operand.v + " >> 7) ) " + operand.trunc + ";\nregs[rF] = (" + operand.v + " & FLAG_C) | sz53pTable[" + operand.v + "];\n" + operand.setter;
    };
    RLCA = function() {
      return "regs[rA] = (regs[rA] << 1) | (regs[rA] >> 7);\nregs[rF] = ( regs[rF] & ( FLAG_P | FLAG_Z | FLAG_S ) ) | ( regs[rA] & ( FLAG_C | FLAG_3 | FLAG_5) );";
    };
    RR = function(param) {
      var operand;
      operand = getParamBoilerplate(param, true);
      return "" + operand.getter + "\nvar rrtemp = " + operand.v + ";\n" + operand.v + " = ( (" + operand.v + " >> 1) | ( regs[rF] << 7 ) ) " + operand.trunc + ";\nregs[rF] = ( rrtemp & FLAG_C ) | sz53pTable[" + operand.v + "];\n" + operand.setter;
    };
    RRC = function(param) {
      var operand;
      operand = getParamBoilerplate(param, true);
      return "" + operand.getter + "\nregs[rF] = " + operand.v + " & FLAG_C;\n" + operand.v + " = ( (" + operand.v + " >> 1) | (" + operand.v + " << 7) ) " + operand.trunc + ";\nregs[rF] |= sz53pTable[" + operand.v + "];\n" + operand.setter;
    };
    RRCA = function() {
      return "regs[rF] = ( regs[rF] & (FLAG_P | FLAG_Z | FLAG_S) ) | (regs[rA] & FLAG_C);\nregs[rA] = ( regs[rA] >> 1) | ( regs[rA] << 7 );\nregs[rF] |= ( regs[rA] & (FLAG_3 | FLAG_5) );";
    };
    RRA = function() {
      return "var bytetemp = regs[rA];\nregs[rA] = ( bytetemp >> 1 ) | ( regs[rF] << 7 );\nregs[rF] = ( regs[rF] & (FLAG_P | FLAG_Z | FLAG_S) ) | ( regs[rA] & (FLAG_3 | FLAG_5) ) | (bytetemp & FLAG_C);";
    };
    RST = function(addr) {
      return "memory.write(--regPairs[rpSP], regPairs[rpPC] >> 8);\nmemory.write(--regPairs[rpSP], regPairs[rpPC] & 0xff);\nregPairs[rpPC] = " + addr + ";\ntstates += 7;";
    };
    SBC_A = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\nvar sbctemp = regs[rA] - " + operand.v + " - ( regs[rF] & FLAG_C );\nvar lookup = ( (regs[rA] & 0x88) >> 3 ) | ( (" + operand.v + " & 0x88) >> 2 ) | ( (sbctemp & 0x88) >> 1 );\nregs[rA] = sbctemp;\nregs[rF] = ( sbctemp & 0x100 ? FLAG_C : 0 ) | FLAG_N | halfcarrySubTable[lookup & 0x07] | overflowSubTable[lookup >> 4] | sz53Table[regs[rA]];";
    };
    SBC_HL_RR = function(rp) {
      return "var sub16temp = regPairs[rpHL] - regPairs[" + rp + "] - (regs[rF] & FLAG_C);\nvar lookup = ( (regPairs[rpHL] & 0x8800) >> 11 ) | ( (regPairs[" + rp + "] & 0x8800) >> 10 ) | ( (sub16temp & 0x8800) >>  9 );\nregPairs[rpHL] = sub16temp;\nregs[rF] = ( sub16temp & 0x10000 ? FLAG_C : 0 ) | FLAG_N | overflowSubTable[lookup >> 4] | ( regs[rH] & ( FLAG_3 | FLAG_5 | FLAG_S ) ) | halfcarrySubTable[lookup&0x07] | ( regPairs[rpHL] ? 0 : FLAG_Z);\ntstates += 7;";
    };
    SCF = function() {
      return "regs[rF] = ( regs[rF] & (FLAG_P | FLAG_Z | FLAG_S) ) | ( regs[rA] & (FLAG_3 | FLAG_5) ) | FLAG_C;";
    };
    SET = function(bit, param) {
      var hexMask, operand;
      hexMask = 1 << bit;
      operand = getParamBoilerplate(param, true);
      return "" + operand.getter + "\n" + operand.v + " |= " + hexMask + ";\n" + operand.setter;
    };
    SHIFT = function(prefix) {
      return "opcodePrefix = '" + prefix + "';\ninterruptible = false;";
    };
    SLA = function(param) {
      var operand;
      operand = getParamBoilerplate(param, true);
      return "" + operand.getter + "\nregs[rF] = " + operand.v + " >> 7;\n" + operand.v + " = (" + operand.v + " << 1) " + operand.trunc + ";\nregs[rF] |= sz53pTable[" + operand.v + "];\n" + operand.setter;
    };
    SRA = function(param) {
      var operand;
      operand = getParamBoilerplate(param, true);
      return "" + operand.getter + "\nregs[rF] = " + operand.v + " & FLAG_C;\n" + operand.v + " = ( (" + operand.v + " & 0x80) | (" + operand.v + " >> 1) ) " + operand.trunc + ";\nregs[rF] |= sz53pTable[" + operand.v + "];\n" + operand.setter;
    };
    SRL = function(param) {
      var operand;
      operand = getParamBoilerplate(param, true);
      return "" + operand.getter + "\nregs[rF] =  " + operand.v + " & FLAG_C;\n" + operand.v + " >>= 1;\nregs[rF] |= sz53pTable[" + operand.v + "];\n" + operand.setter;
    };
    SUB_A = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\nvar subtemp = regs[rA] - " + operand.v + ";\nvar lookup = ( (regs[rA] & 0x88) >> 3 ) | ( (" + operand.v + " & 0x88) >> 2 ) | ( (subtemp & 0x88) >> 1 );\nregs[rA] = subtemp;\nregs[rF] = ( subtemp & 0x100 ? FLAG_C : 0 ) | FLAG_N | halfcarrySubTable[lookup & 0x07] | overflowSubTable[lookup >> 4] | sz53Table[regs[rA]];";
    };
    XOR_A = function(param) {
      var operand;
      operand = getParamBoilerplate(param);
      return "" + operand.getter + "\nregs[rA] ^= " + operand.v + ";\nregs[rF] = sz53pTable[regs[rA]];";
    };
    buildRunnerFunctions = function(runStringTable, fallbackTable, passOffsetAsParam) {
      var i, runString, runnerFunctions;
      if (fallbackTable == null) fallbackTable = {};
      if (passOffsetAsParam == null) passOffsetAsParam = false;
      runnerFunctions = {};
      for (i = 0; 0 <= 0x100 ? i < 0x100 : i > 0x100; 0 <= 0x100 ? i++ : i--) {
        runString = runStringTable[i];
        if (runString === null) runString = fallbackTable[i];
        if (runString !== null) {
          if (passOffsetAsParam) {
            runnerFunctions[i] = eval("(function(offset) {" + runString + "})");
          } else {
            runnerFunctions[i] = eval("(function() {" + runString + "})");
          }
        }
      }
      return runnerFunctions;
    };
    opcodeSwitch = function(runStringTable, fallbackTable) {
      var clauses, i, runString;
      if (fallbackTable == null) fallbackTable = {};
      clauses = [];
      for (i = 0; 0 <= 0x100 ? i < 0x100 : i > 0x100; 0 <= 0x100 ? i++ : i--) {
        runString = runStringTable[i];
        if (runString === null) runString = fallbackTable[i];
        if (runString !== null) {
          clauses.push("case " + i + ":\n	" + runString + "\n	break;");
        }
      }
      return "switch (opcode) {\n	" + (clauses.join('')) + "\n	default:\n		throw(\"Unimplemented opcode: \" + opcode);\n}";
    };
    OPCODE_RUN_STRINGS_CB = {
      0x00: RLC("B"),
      0x01: RLC("C"),
      0x02: RLC("D"),
      0x03: RLC("E"),
      0x04: RLC("H"),
      0x05: RLC("L"),
      0x06: RLC("(HL)"),
      0x07: RLC("A"),
      0x08: RRC("B"),
      0x09: RRC("C"),
      0x0a: RRC("D"),
      0x0b: RRC("E"),
      0x0c: RRC("H"),
      0x0d: RRC("L"),
      0x0e: RRC("(HL)"),
      0x0f: RRC("A"),
      0x10: RL('B'),
      0x11: RL('C'),
      0x12: RL('D'),
      0x13: RL('E'),
      0x14: RL('H'),
      0x15: RL('L'),
      0x16: RL('(HL)'),
      0x17: RL('A'),
      0x18: RR('B'),
      0x19: RR('C'),
      0x1a: RR('D'),
      0x1b: RR('E'),
      0x1c: RR('H'),
      0x1d: RR('L'),
      0x1e: RR('(HL)'),
      0x1f: RR('A'),
      0x20: SLA('B'),
      0x21: SLA('C'),
      0x22: SLA('D'),
      0x23: SLA('E'),
      0x24: SLA('H'),
      0x25: SLA('L'),
      0x26: SLA('(HL)'),
      0x27: SLA('A'),
      0x28: SRA('B'),
      0x29: SRA('C'),
      0x2a: SRA('D'),
      0x2b: SRA('E'),
      0x2c: SRA('H'),
      0x2d: SRA('L'),
      0x2e: SRA('(HL)'),
      0x2f: SRA('A'),
      0x38: SRL('B'),
      0x39: SRL('C'),
      0x3a: SRL('D'),
      0x3b: SRL('E'),
      0x3c: SRL('H'),
      0x3d: SRL('L'),
      0x3e: SRL('(HL)'),
      0x3f: SRL('A'),
      0x40: BIT_N_R(0, rB),
      0x41: BIT_N_R(0, rC),
      0x42: BIT_N_R(0, rD),
      0x43: BIT_N_R(0, rE),
      0x44: BIT_N_R(0, rH),
      0x45: BIT_N_R(0, rL),
      0x46: BIT_N_iHLi(0),
      0x47: BIT_N_R(0, rA),
      0x48: BIT_N_R(1, rB),
      0x49: BIT_N_R(1, rC),
      0x4A: BIT_N_R(1, rD),
      0x4B: BIT_N_R(1, rE),
      0x4C: BIT_N_R(1, rH),
      0x4D: BIT_N_R(1, rL),
      0x4E: BIT_N_iHLi(1),
      0x4F: BIT_N_R(1, rA),
      0x50: BIT_N_R(2, rB),
      0x51: BIT_N_R(2, rC),
      0x52: BIT_N_R(2, rD),
      0x53: BIT_N_R(2, rE),
      0x54: BIT_N_R(2, rH),
      0x55: BIT_N_R(2, rL),
      0x56: BIT_N_iHLi(2),
      0x57: BIT_N_R(2, rA),
      0x58: BIT_N_R(3, rB),
      0x59: BIT_N_R(3, rC),
      0x5A: BIT_N_R(3, rD),
      0x5B: BIT_N_R(3, rE),
      0x5C: BIT_N_R(3, rH),
      0x5D: BIT_N_R(3, rL),
      0x5E: BIT_N_iHLi(3),
      0x5F: BIT_N_R(3, rA),
      0x60: BIT_N_R(4, rB),
      0x61: BIT_N_R(4, rC),
      0x62: BIT_N_R(4, rD),
      0x63: BIT_N_R(4, rE),
      0x64: BIT_N_R(4, rH),
      0x65: BIT_N_R(4, rL),
      0x66: BIT_N_iHLi(4),
      0x67: BIT_N_R(4, rA),
      0x68: BIT_N_R(5, rB),
      0x69: BIT_N_R(5, rC),
      0x6A: BIT_N_R(5, rD),
      0x6B: BIT_N_R(5, rE),
      0x6C: BIT_N_R(5, rH),
      0x6D: BIT_N_R(5, rL),
      0x6E: BIT_N_iHLi(5),
      0x6F: BIT_N_R(5, rA),
      0x70: BIT_N_R(6, rB),
      0x71: BIT_N_R(6, rC),
      0x72: BIT_N_R(6, rD),
      0x73: BIT_N_R(6, rE),
      0x74: BIT_N_R(6, rH),
      0x75: BIT_N_R(6, rL),
      0x76: BIT_N_iHLi(6),
      0x77: BIT_N_R(6, rA),
      0x78: BIT_N_R(7, rB),
      0x79: BIT_N_R(7, rC),
      0x7A: BIT_N_R(7, rD),
      0x7B: BIT_N_R(7, rE),
      0x7C: BIT_N_R(7, rH),
      0x7D: BIT_N_R(7, rL),
      0x7E: BIT_N_iHLi(7),
      0x7F: BIT_N_R(7, rA),
      0x80: RES(0, 'B'),
      0x81: RES(0, 'C'),
      0x82: RES(0, 'D'),
      0x83: RES(0, 'E'),
      0x84: RES(0, 'H'),
      0x85: RES(0, 'L'),
      0x86: RES(0, '(HL)'),
      0x87: RES(0, 'A'),
      0x88: RES(1, 'B'),
      0x89: RES(1, 'C'),
      0x8A: RES(1, 'D'),
      0x8B: RES(1, 'E'),
      0x8C: RES(1, 'H'),
      0x8D: RES(1, 'L'),
      0x8E: RES(1, '(HL)'),
      0x8F: RES(1, 'A'),
      0x90: RES(2, 'B'),
      0x91: RES(2, 'C'),
      0x92: RES(2, 'D'),
      0x93: RES(2, 'E'),
      0x94: RES(2, 'H'),
      0x95: RES(2, 'L'),
      0x96: RES(2, '(HL)'),
      0x97: RES(2, 'A'),
      0x98: RES(3, 'B'),
      0x99: RES(3, 'C'),
      0x9A: RES(3, 'D'),
      0x9B: RES(3, 'E'),
      0x9C: RES(3, 'H'),
      0x9D: RES(3, 'L'),
      0x9E: RES(3, '(HL)'),
      0x9F: RES(3, 'A'),
      0xA0: RES(4, 'B'),
      0xA1: RES(4, 'C'),
      0xA2: RES(4, 'D'),
      0xA3: RES(4, 'E'),
      0xA4: RES(4, 'H'),
      0xA5: RES(4, 'L'),
      0xA6: RES(4, '(HL)'),
      0xA7: RES(4, 'A'),
      0xA8: RES(5, 'B'),
      0xA9: RES(5, 'C'),
      0xAA: RES(5, 'D'),
      0xAB: RES(5, 'E'),
      0xAC: RES(5, 'H'),
      0xAD: RES(5, 'L'),
      0xAE: RES(5, '(HL)'),
      0xAF: RES(5, 'A'),
      0xB0: RES(6, 'B'),
      0xB1: RES(6, 'C'),
      0xB2: RES(6, 'D'),
      0xB3: RES(6, 'E'),
      0xB4: RES(6, 'H'),
      0xB5: RES(6, 'L'),
      0xB6: RES(6, '(HL)'),
      0xB7: RES(6, 'A'),
      0xB8: RES(7, 'B'),
      0xB9: RES(7, 'C'),
      0xBA: RES(7, 'D'),
      0xBB: RES(7, 'E'),
      0xBC: RES(7, 'H'),
      0xBD: RES(7, 'L'),
      0xBE: RES(7, '(HL)'),
      0xBF: RES(7, 'A'),
      0xC0: SET(0, 'B'),
      0xC1: SET(0, 'C'),
      0xC2: SET(0, 'D'),
      0xC3: SET(0, 'E'),
      0xC4: SET(0, 'H'),
      0xC5: SET(0, 'L'),
      0xC6: SET(0, '(HL)'),
      0xC7: SET(0, 'A'),
      0xC8: SET(1, 'B'),
      0xC9: SET(1, 'C'),
      0xCA: SET(1, 'D'),
      0xCB: SET(1, 'E'),
      0xCC: SET(1, 'H'),
      0xCD: SET(1, 'L'),
      0xCE: SET(1, '(HL)'),
      0xCF: SET(1, 'A'),
      0xD0: SET(2, 'B'),
      0xD1: SET(2, 'C'),
      0xD2: SET(2, 'D'),
      0xD3: SET(2, 'E'),
      0xD4: SET(2, 'H'),
      0xD5: SET(2, 'L'),
      0xD6: SET(2, '(HL)'),
      0xD7: SET(2, 'A'),
      0xD8: SET(3, 'B'),
      0xD9: SET(3, 'C'),
      0xDA: SET(3, 'D'),
      0xDB: SET(3, 'E'),
      0xDC: SET(3, 'H'),
      0xDD: SET(3, 'L'),
      0xDE: SET(3, '(HL)'),
      0xDF: SET(3, 'A'),
      0xE0: SET(4, 'B'),
      0xE1: SET(4, 'C'),
      0xE2: SET(4, 'D'),
      0xE3: SET(4, 'E'),
      0xE4: SET(4, 'H'),
      0xE5: SET(4, 'L'),
      0xE6: SET(4, '(HL)'),
      0xE7: SET(4, 'A'),
      0xE8: SET(5, 'B'),
      0xE9: SET(5, 'C'),
      0xEA: SET(5, 'D'),
      0xEB: SET(5, 'E'),
      0xEC: SET(5, 'H'),
      0xED: SET(5, 'L'),
      0xEE: SET(5, '(HL)'),
      0xEF: SET(5, 'A'),
      0xF0: SET(6, 'B'),
      0xF1: SET(6, 'C'),
      0xF2: SET(6, 'D'),
      0xF3: SET(6, 'E'),
      0xF4: SET(6, 'H'),
      0xF5: SET(6, 'L'),
      0xF6: SET(6, '(HL)'),
      0xF7: SET(6, 'A'),
      0xF8: SET(7, 'B'),
      0xF9: SET(7, 'C'),
      0xFA: SET(7, 'D'),
      0xFB: SET(7, 'E'),
      0xFC: SET(7, 'H'),
      0xFD: SET(7, 'L'),
      0xFE: SET(7, '(HL)'),
      0xFF: SET(7, 'A'),
      0x100: 'cb'
    };
    generateddfdcbOpcodeSet = function(prefix) {
      var rh, rhn, rl, rln, rp, rpn;
      if (prefix === 'DDCB') {
        rp = rpIX;
        rh = rIXH;
        rl = rIXL;
        rpn = 'IX';
        rhn = 'IXH';
        rln = 'IXL';
      } else {
        rp = rpIY;
        rh = rIYH;
        rl = rIYL;
        rpn = 'IY';
        rhn = 'IYH';
        rln = 'IYL';
      }
      return {
        0x06: RLC("(" + rpn + "+nn)"),
        0x0E: RRC("(" + rpn + "+nn)"),
        0x16: RL("(" + rpn + "+nn)"),
        0x1E: RR("(" + rpn + "+nn)"),
        0x26: SLA("(" + rpn + "+nn)"),
        0x2E: SRA("(" + rpn + "+nn)"),
        0x3E: SRL("(" + rpn + "+nn)"),
        0x46: BIT_N_iRRpNNi(0, rp),
        0x4E: BIT_N_iRRpNNi(1, rp),
        0x56: BIT_N_iRRpNNi(2, rp),
        0x5E: BIT_N_iRRpNNi(3, rp),
        0x66: BIT_N_iRRpNNi(4, rp),
        0x6E: BIT_N_iRRpNNi(5, rp),
        0x76: BIT_N_iRRpNNi(6, rp),
        0x7E: BIT_N_iRRpNNi(7, rp),
        0x86: RES(0, "(" + rpn + "+nn)"),
        0x8E: RES(1, "(" + rpn + "+nn)"),
        0x96: RES(2, "(" + rpn + "+nn)"),
        0x9E: RES(3, "(" + rpn + "+nn)"),
        0xA6: RES(4, "(" + rpn + "+nn)"),
        0xAE: RES(5, "(" + rpn + "+nn)"),
        0xB6: RES(6, "(" + rpn + "+nn)"),
        0xBE: RES(7, "(" + rpn + "+nn)"),
        0xC6: SET(0, "(" + rpn + "+nn)"),
        0xCE: SET(1, "(" + rpn + "+nn)"),
        0xD6: SET(2, "(" + rpn + "+nn)"),
        0xDE: SET(3, "(" + rpn + "+nn)"),
        0xE6: SET(4, "(" + rpn + "+nn)"),
        0xEE: SET(5, "(" + rpn + "+nn)"),
        0xF6: SET(6, "(" + rpn + "+nn)"),
        0xFE: SET(7, "(" + rpn + "+nn)"),
        0x100: 'ddcb'
      };
    };
    OPCODE_RUN_STRINGS_DDCB = generateddfdcbOpcodeSet('DDCB');
    OPCODE_RUN_STRINGS_FDCB = generateddfdcbOpcodeSet('FDCB');
    generateddfdOpcodeSet = function(prefix) {
      var rh, rhn, rl, rln, rp, rpn;
      if (prefix === 'DD') {
        rp = rpIX;
        rh = rIXH;
        rl = rIXL;
        rpn = 'IX';
        rhn = 'IXH';
        rln = 'IXL';
      } else {
        rp = rpIY;
        rh = rIYH;
        rl = rIYL;
        rpn = 'IY';
        rhn = 'IYH';
        rln = 'IYL';
      }
      return {
        0x09: ADD_RR_RR(rp, rpBC),
        0x19: ADD_RR_RR(rp, rpDE),
        0x21: LD_RR_NN(rp),
        0x22: LD_iNNi_RR(rp),
        0x23: INC_RR(rp),
        0x24: INC(rhn),
        0x25: DEC(rhn),
        0x26: LD_R_N(rh),
        0x29: ADD_RR_RR(rp, rp),
        0x2A: LD_RR_iNNi(rp),
        0x2B: DEC_RR(rp),
        0x2C: INC(rln),
        0x2D: DEC(rln),
        0x2E: LD_R_N(rl),
        0x34: INC("(" + rpn + "+nn)"),
        0x35: DEC("(" + rpn + "+nn)"),
        0x36: LD_iRRpNNi_N(rp),
        0x39: ADD_RR_RR(rp, rpSP),
        0x44: LD_R_R(rB, rh),
        0x45: LD_R_R(rB, rl),
        0x46: LD_R_iRRpNNi(rB, rp),
        0x4C: LD_R_R(rC, rh),
        0x4D: LD_R_R(rC, rl),
        0x4E: LD_R_iRRpNNi(rC, rp),
        0x54: LD_R_R(rD, rh),
        0x55: LD_R_R(rD, rl),
        0x56: LD_R_iRRpNNi(rD, rp),
        0x5C: LD_R_R(rE, rh),
        0x5D: LD_R_R(rE, rl),
        0x5E: LD_R_iRRpNNi(rE, rp),
        0x60: LD_R_R(rh, rB),
        0x61: LD_R_R(rh, rC),
        0x62: LD_R_R(rh, rD),
        0x63: LD_R_R(rh, rE),
        0x64: LD_R_R(rh, rh),
        0x65: LD_R_R(rh, rl),
        0x66: LD_R_iRRpNNi(rH, rp),
        0x67: LD_R_R(rh, rA),
        0x68: LD_R_R(rl, rB),
        0x69: LD_R_R(rl, rC),
        0x6A: LD_R_R(rl, rD),
        0x6B: LD_R_R(rl, rE),
        0x6C: LD_R_R(rl, rh),
        0x6D: LD_R_R(rl, rl),
        0x6E: LD_R_iRRpNNi(rL, rp),
        0x6F: LD_R_R(rl, rA),
        0x70: LD_iRRpNNi_R(rp, rB),
        0x71: LD_iRRpNNi_R(rp, rC),
        0x72: LD_iRRpNNi_R(rp, rD),
        0x73: LD_iRRpNNi_R(rp, rE),
        0x74: LD_iRRpNNi_R(rp, rH),
        0x75: LD_iRRpNNi_R(rp, rL),
        0x77: LD_iRRpNNi_R(rp, rA),
        0x7C: LD_R_R(rA, rh),
        0x7D: LD_R_R(rA, rl),
        0x7E: LD_R_iRRpNNi(rA, rp),
        0x84: ADD_A(rhn),
        0x85: ADD_A(rln),
        0x86: ADD_A("(" + rpn + "+nn)"),
        0x8C: ADC_A(rhn),
        0x8D: ADC_A(rln),
        0x8E: ADC_A("(" + rpn + "+nn)"),
        0x94: SUB_A(rhn),
        0x95: SUB_A(rln),
        0x96: SUB_A("(" + rpn + "+nn)"),
        0x9C: SBC_A(rhn),
        0x9D: SBC_A(rln),
        0x9E: SBC_A("(" + rpn + "+nn)"),
        0xA4: AND_A(rhn),
        0xA5: AND_A(rln),
        0xA6: AND_A("(" + rpn + "+nn)"),
        0xAC: XOR_A(rhn),
        0xAD: XOR_A(rln),
        0xAE: XOR_A("(" + rpn + "+nn)"),
        0xB4: OR_A(rhn),
        0xB5: OR_A(rln),
        0xB6: OR_A("(" + rpn + "+nn)"),
        0xBC: CP_A(rhn),
        0xBD: CP_A(rln),
        0xBE: CP_A("(" + rpn + "+nn)"),
        0xCB: SHIFT(prefix + 'CB'),
        0xDD: SHIFT('DD'),
        0xE1: POP_RR(rp),
        0xE3: EX_iSPi_RR(rp),
        0xE5: PUSH_RR(rp),
        0xE9: JP_RR(rp),
        0xF9: LD_RR_RR(rpSP, rp),
        0xFD: SHIFT('FD'),
        0x100: 'dd'
      };
    };
    OPCODE_RUN_STRINGS_DD = generateddfdOpcodeSet('DD');
    OPCODE_RUN_STRINGS_ED = {
      0x40: IN_R_iCi(rB),
      0x41: OUT_iCi_R(rB),
      0x42: SBC_HL_RR(rpBC),
      0x43: LD_iNNi_RR(rpBC),
      0x44: NEG(),
      0x46: IM(0),
      0x47: LD_R_R(rI, rA),
      0x48: IN_R_iCi(rC),
      0x49: OUT_iCi_R(rC),
      0x4B: LD_RR_iNNi(rpBC),
      0x50: IN_R_iCi(rD),
      0x51: OUT_iCi_R(rD),
      0x52: SBC_HL_RR(rpDE),
      0x53: LD_iNNi_RR(rpDE),
      0x56: IM(1),
      0x58: IN_R_iCi(rE),
      0x59: OUT_iCi_R(rE),
      0x5B: LD_RR_iNNi(rpDE),
      0x5E: IM(2),
      0x60: IN_R_iCi(rH),
      0x61: OUT_iCi_R(rH),
      0x62: SBC_HL_RR(rpHL),
      0x68: IN_R_iCi(rL),
      0x69: OUT_iCi_R(rL),
      0x6B: LD_RR_iNNi(rpHL, true),
      0x72: SBC_HL_RR(rpSP),
      0x73: LD_iNNi_RR(rpSP),
      0x78: IN_R_iCi(rA),
      0x79: OUT_iCi_R(rA),
      0x7B: LD_RR_iNNi(rpSP),
      0xA0: LDI(),
      0xB0: LDIR(),
      0xb1: CPIR(),
      0xB8: LDDR(),
      0xb9: CPDR(),
      0x100: 'ed'
    };
    OPCODE_RUN_STRINGS_FD = generateddfdOpcodeSet('FD');
    OPCODE_RUN_STRINGS = {
      0x00: NOP(),
      0x01: LD_RR_NN(rpBC),
      0x02: LD_iRRi_R(rpBC, rA),
      0x03: INC_RR(rpBC),
      0x04: INC("B"),
      0x05: DEC("B"),
      0x06: LD_R_N(rB),
      0x07: RLCA(),
      0x08: EX_RR_RR(rpAF, rpAF_),
      0x09: ADD_RR_RR(rpHL, rpBC),
      0x0A: LD_R_iRRi(rA, rpBC),
      0x0B: DEC_RR(rpBC),
      0x0C: INC("C"),
      0x0D: DEC("C"),
      0x0E: LD_R_N(rC),
      0x0F: RRCA(),
      0x10: DJNZ_N(),
      0x11: LD_RR_NN(rpDE),
      0x12: LD_iRRi_R(rpDE, rA),
      0x13: INC_RR(rpDE),
      0x14: INC("D"),
      0x15: DEC("D"),
      0x16: LD_R_N(rD),
      0x17: RLA(),
      0x18: JR_N(),
      0x19: ADD_RR_RR(rpHL, rpDE),
      0x1A: LD_R_iRRi(rA, rpDE),
      0x1B: DEC_RR(rpDE),
      0x1C: INC("E"),
      0x1D: DEC("E"),
      0x1E: LD_R_N(rE),
      0x1F: RRA(),
      0x20: JR_C_N(FLAG_Z, false),
      0x21: LD_RR_NN(rpHL),
      0x22: LD_iNNi_RR(rpHL),
      0x23: INC_RR(rpHL),
      0x24: INC("H"),
      0x25: DEC("H"),
      0x26: LD_R_N(rH),
      0x28: JR_C_N(FLAG_Z, true),
      0x29: ADD_RR_RR(rpHL, rpHL),
      0x2A: LD_RR_iNNi(rpHL),
      0x2B: DEC_RR(rpHL),
      0x2C: INC("L"),
      0x2D: DEC("L"),
      0x2E: LD_R_N(rL),
      0x2F: CPL(),
      0x30: JR_C_N(FLAG_C, false),
      0x31: LD_RR_NN(rpSP),
      0x32: LD_iNNi_A(),
      0x33: INC_RR(rpSP),
      0x34: INC("(HL)"),
      0x35: DEC("(HL)"),
      0x36: LD_iRRi_N(rpHL),
      0x37: SCF(),
      0x38: JR_C_N(FLAG_C, true),
      0x39: ADD_RR_RR(rpHL, rpSP),
      0x3A: LD_A_iNNi(),
      0x3B: DEC_RR(rpSP),
      0x3C: INC("A"),
      0x3D: DEC("A"),
      0x3E: LD_R_N(rA),
      0x3F: CCF(),
      0x40: LD_R_R(rB, rB),
      0x41: LD_R_R(rB, rC),
      0x42: LD_R_R(rB, rD),
      0x43: LD_R_R(rB, rE),
      0x44: LD_R_R(rB, rH),
      0x45: LD_R_R(rB, rL),
      0x46: LD_R_iRRi(rB, rpHL),
      0x47: LD_R_R(rB, rA),
      0x48: LD_R_R(rC, rB),
      0x49: LD_R_R(rC, rC),
      0x4a: LD_R_R(rC, rD),
      0x4b: LD_R_R(rC, rE),
      0x4c: LD_R_R(rC, rH),
      0x4d: LD_R_R(rC, rL),
      0x4e: LD_R_iRRi(rC, rpHL),
      0x4f: LD_R_R(rC, rA),
      0x50: LD_R_R(rD, rB),
      0x51: LD_R_R(rD, rC),
      0x52: LD_R_R(rD, rD),
      0x53: LD_R_R(rD, rE),
      0x54: LD_R_R(rD, rH),
      0x55: LD_R_R(rD, rL),
      0x56: LD_R_iRRi(rD, rpHL),
      0x57: LD_R_R(rD, rA),
      0x58: LD_R_R(rE, rB),
      0x59: LD_R_R(rE, rC),
      0x5a: LD_R_R(rE, rD),
      0x5b: LD_R_R(rE, rE),
      0x5c: LD_R_R(rE, rH),
      0x5d: LD_R_R(rE, rL),
      0x5e: LD_R_iRRi(rE, rpHL),
      0x5f: LD_R_R(rE, rA),
      0x60: LD_R_R(rH, rB),
      0x61: LD_R_R(rH, rC),
      0x62: LD_R_R(rH, rD),
      0x63: LD_R_R(rH, rE),
      0x64: LD_R_R(rH, rH),
      0x65: LD_R_R(rH, rL),
      0x66: LD_R_iRRi(rH, rpHL),
      0x67: LD_R_R(rH, rA),
      0x68: LD_R_R(rL, rB),
      0x69: LD_R_R(rL, rC),
      0x6a: LD_R_R(rL, rD),
      0x6b: LD_R_R(rL, rE),
      0x6c: LD_R_R(rL, rH),
      0x6d: LD_R_R(rL, rL),
      0x6e: LD_R_iRRi(rL, rpHL),
      0x6f: LD_R_R(rL, rA),
      0x70: LD_iRRi_R(rpHL, rB),
      0x71: LD_iRRi_R(rpHL, rC),
      0x72: LD_iRRi_R(rpHL, rD),
      0x73: LD_iRRi_R(rpHL, rE),
      0x74: LD_iRRi_R(rpHL, rH),
      0x75: LD_iRRi_R(rpHL, rL),
      0x76: HALT(),
      0x77: LD_iRRi_R(rpHL, rA),
      0x78: LD_R_R(rA, rB),
      0x79: LD_R_R(rA, rC),
      0x7a: LD_R_R(rA, rD),
      0x7b: LD_R_R(rA, rE),
      0x7c: LD_R_R(rA, rH),
      0x7d: LD_R_R(rA, rL),
      0x7e: LD_R_iRRi(rA, rpHL),
      0x7f: LD_R_R(rA, rA),
      0x80: ADD_A("B"),
      0x81: ADD_A("C"),
      0x82: ADD_A("D"),
      0x83: ADD_A("E"),
      0x84: ADD_A("H"),
      0x85: ADD_A("L"),
      0x86: ADD_A("(HL)"),
      0x87: ADD_A("A"),
      0x88: ADC_A("B"),
      0x89: ADC_A("C"),
      0x8a: ADC_A("D"),
      0x8b: ADC_A("E"),
      0x8c: ADC_A("H"),
      0x8d: ADC_A("L"),
      0x8e: ADC_A("(HL)"),
      0x8f: ADC_A("A"),
      0x90: SUB_A("B"),
      0x91: SUB_A("C"),
      0x92: SUB_A("D"),
      0x93: SUB_A("E"),
      0x94: SUB_A("H"),
      0x95: SUB_A("L"),
      0x96: SUB_A("(HL)"),
      0x97: SUB_A("A"),
      0x98: SBC_A("B"),
      0x99: SBC_A("C"),
      0x9a: SBC_A("D"),
      0x9b: SBC_A("E"),
      0x9c: SBC_A("H"),
      0x9d: SBC_A("L"),
      0x9e: SBC_A("(HL)"),
      0x9f: SBC_A("A"),
      0xa0: AND_A("B"),
      0xa1: AND_A("C"),
      0xa2: AND_A("D"),
      0xa3: AND_A("E"),
      0xa4: AND_A("H"),
      0xa5: AND_A("L"),
      0xa6: AND_A("(HL)"),
      0xa7: AND_A("A"),
      0xA8: XOR_A("B"),
      0xA9: XOR_A("C"),
      0xAA: XOR_A("D"),
      0xAB: XOR_A("E"),
      0xAC: XOR_A("H"),
      0xAD: XOR_A("L"),
      0xAE: XOR_A("(HL)"),
      0xAF: XOR_A("A"),
      0xb0: OR_A("B"),
      0xb1: OR_A("C"),
      0xb2: OR_A("D"),
      0xb3: OR_A("E"),
      0xb4: OR_A("H"),
      0xb5: OR_A("L"),
      0xb6: OR_A("(HL)"),
      0xb7: OR_A("A"),
      0xb8: CP_A("B"),
      0xb9: CP_A("C"),
      0xba: CP_A("D"),
      0xbb: CP_A("E"),
      0xbc: CP_A("H"),
      0xbd: CP_A("L"),
      0xbe: CP_A("(HL)"),
      0xbf: CP_A("A"),
      0xC0: RET_C(FLAG_Z, false),
      0xC1: POP_RR(rpBC),
      0xC2: JP_C_NN(FLAG_Z, false),
      0xC3: JP_NN(),
      0xC4: CALL_C_NN(FLAG_Z, false),
      0xC5: PUSH_RR(rpBC),
      0xC6: ADD_A("nn"),
      0xC7: RST(0x0000),
      0xC8: RET_C(FLAG_Z, true),
      0xC9: RET(),
      0xCA: JP_C_NN(FLAG_Z, true),
      0xCB: SHIFT('CB'),
      0xCC: CALL_C_NN(FLAG_Z, true),
      0xCD: CALL_NN(),
      0xCE: ADC_A("nn"),
      0xCF: RST(0x0008),
      0xD0: RET_C(FLAG_C, false),
      0xD1: POP_RR(rpDE),
      0xD2: JP_C_NN(FLAG_C, false),
      0xD3: OUT_iNi_A(),
      0xD4: CALL_C_NN(FLAG_C, false),
      0xD5: PUSH_RR(rpDE),
      0xD6: SUB_A("nn"),
      0xD7: RST(0x0010),
      0xD8: RET_C(FLAG_C, true),
      0xD9: EXX(),
      0xDA: JP_C_NN(FLAG_C, true),
      0xDB: IN_A_N(),
      0xDC: CALL_C_NN(FLAG_C, true),
      0xDD: SHIFT('DD'),
      0xDE: SBC_A("nn"),
      0xDF: RST(0x0018),
      0xE0: RET_C(FLAG_P, false),
      0xE1: POP_RR(rpHL),
      0xE2: JP_C_NN(FLAG_P, false),
      0xE3: EX_iSPi_RR(rpHL),
      0xE4: CALL_C_NN(FLAG_P, false),
      0xE5: PUSH_RR(rpHL),
      0xE6: AND_A("nn"),
      0xE7: RST(0x0020),
      0xE8: RET_C(FLAG_P, true),
      0xE9: JP_RR(rpHL),
      0xEA: JP_C_NN(FLAG_P, true),
      0xEB: EX_RR_RR(rpDE, rpHL),
      0xEC: CALL_C_NN(FLAG_P, true),
      0xED: SHIFT('ED'),
      0xEE: XOR_A("nn"),
      0xEF: RST(0x0028),
      0xF0: RET_C(FLAG_S, false),
      0xF1: POP_RR(rpAF),
      0xF2: JP_C_NN(FLAG_S, false),
      0xF3: DI(),
      0xF4: CALL_C_NN(FLAG_S, false),
      0xF5: PUSH_RR(rpAF),
      0xF6: OR_A("nn"),
      0xF7: RST(0x0030),
      0xF8: RET_C(FLAG_S, true),
      0xF9: LD_RR_RR(rpSP, rpHL),
      0xFA: JP_C_NN(FLAG_S, true),
      0xFB: EI(),
      0xFC: CALL_C_NN(FLAG_S, true),
      0xFD: SHIFT('FD'),
      0xFE: CP_A("nn"),
      0xFF: RST(0x0038),
      0x100: 0
    };
    OPCODE_RUNNERS = buildRunnerFunctions(OPCODE_RUN_STRINGS);
    OPCODE_RUNNERS_CB = buildRunnerFunctions(OPCODE_RUN_STRINGS_CB);
    OPCODE_RUNNERS_DD = buildRunnerFunctions(OPCODE_RUN_STRINGS_DD, OPCODE_RUN_STRINGS);
    OPCODE_RUNNERS_ED = buildRunnerFunctions(OPCODE_RUN_STRINGS_ED);
    OPCODE_RUNNERS_FD = buildRunnerFunctions(OPCODE_RUN_STRINGS_FD, OPCODE_RUN_STRINGS);
    OPCODE_RUNNERS_DDCB = buildRunnerFunctions(OPCODE_RUN_STRINGS_DDCB, {}, true);
    OPCODE_RUNNERS_FDCB = buildRunnerFunctions(OPCODE_RUN_STRINGS_FDCB, {}, true);
    z80Interrupt = function() {
      var h, inttemp, l;
      if (iff1) {
        if (halted) {
          regPairs[rpPC]++;
          halted = false;
        }
        iff1 = iff2 = 0;
        memory.write(--regPairs[rpSP], regPairs[rpPC] >> 8);
        memory.write(--regPairs[rpSP], regPairs[rpPC] & 0xff);
        switch (im) {
          case 0:
            regPairs[rpPC] = 0x0038;
            return tstates += 12;
          case 1:
            regPairs[rpPC] = 0x0038;
            return tstates += 13;
          case 2:
            inttemp = (regs[rI] << 8) | 0xff;
            l = memory.read(inttemp);
            h = memory.read((inttemp + 1) & 0xffff);
            regPairs[rpPC] = (h << 8) | l;
            return tstates += 19;
        }
      }
    };
    interruptible = true;
    interruptPending = false;
    opcodePrefix = '';
    self.runFrame = eval("(function() {\n	var lastOpcodePrefix, offset, opcode;\n	\n	display.startFrame();\n	interruptPending = true;\n	while (tstates < display.frameLength) {\n		if (interruptPending && interruptible) {\n			z80Interrupt();\n			interruptPending = false;\n		}\n		interruptible = true; /* unless overridden by opcode */\n		lastOpcodePrefix = opcodePrefix;\n		opcodePrefix = '';\n		switch (lastOpcodePrefix) {\n			case '':\n				opcode = memory.read(regPairs[rpPC]++);\n				tstates += 4;\n				" + (opcodeSwitch(OPCODE_RUN_STRINGS)) + "\n				break;\n			case 'CB':\n				opcode = memory.read(regPairs[rpPC]++);\n				tstates += 4;\n				" + (opcodeSwitch(OPCODE_RUN_STRINGS_CB)) + "\n				break;\n			case 'DD':\n				opcode = memory.read(regPairs[rpPC]++);\n				tstates += 4;\n				" + (opcodeSwitch(OPCODE_RUN_STRINGS_DD)) + "\n				break;\n			case 'DDCB':\n				offset = memory.read(regPairs[rpPC]++);\n				if (offset & 0x80) offset -= 0x100;\n				opcode = memory.read(regPairs[rpPC]++);\n				" + (opcodeSwitch(OPCODE_RUN_STRINGS_DDCB)) + "\n				break;\n			case 'ED':\n				opcode = memory.read(regPairs[rpPC]++);\n				tstates += 4;\n				" + (opcodeSwitch(OPCODE_RUN_STRINGS_ED)) + "\n				break;\n			case 'FD':\n				opcode = memory.read(regPairs[rpPC]++);\n				tstates += 4;\n				" + (opcodeSwitch(OPCODE_RUN_STRINGS_FD)) + "\n				break;\n			case 'FDCB':\n				offset = memory.read(regPairs[rpPC]++);\n				if (offset & 0x80) offset -= 0x100;\n				opcode = memory.read(regPairs[rpPC]++);\n				" + (opcodeSwitch(OPCODE_RUN_STRINGS_FDCB)) + "\n				break;\n			default:\n				throw(\"Unknown opcode prefix: \" + lastOpcodePrefix);\n		}\n			\n		while (display.nextEventTime != null && display.nextEventTime <= tstates) {\n			display.doEvent();\n		}\n	}\n	\n	display.endFrame();\n	tstates -= display.frameLength;\n})");
    self.reset = function() {
      regPairs[rpPC] = regPairs[rpIR] = 0;
      iff1 = 0;
      iff2 = 0;
      im = 0;
      return halted = false;
    };
    self.loadFromSnapshot = function(snapRegs) {
      regPairs[rpAF] = snapRegs['AF'];
      regPairs[rpBC] = snapRegs['BC'];
      regPairs[rpDE] = snapRegs['DE'];
      regPairs[rpHL] = snapRegs['HL'];
      regPairs[rpAF_] = snapRegs['AF_'];
      regPairs[rpBC_] = snapRegs['BC_'];
      regPairs[rpDE_] = snapRegs['DE_'];
      regPairs[rpHL_] = snapRegs['HL_'];
      regPairs[rpIX] = snapRegs['IX'];
      regPairs[rpIY] = snapRegs['IY'];
      regPairs[rpSP] = snapRegs['SP'];
      regPairs[rpPC] = snapRegs['PC'];
      regPairs[rpIR] = snapRegs['IR'];
      iff1 = snapRegs['iff1'];
      iff2 = snapRegs['iff2'];
      return im = snapRegs['im'];
    };
    return self;
  };

}).call(this);
