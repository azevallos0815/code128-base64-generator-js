//---------------------------------------------------------------------
// code128
//---------------------------------------------------------------------
/**
 * code128
 * no parameter needed :)
 */
import code128Table from "./code128.js"
var encode = function () {
	var _this = {};
	let _str;
	let _code;
	_this.addData = function (str) {
		//console.log(str)
		_str = str;
	};
	_this.make = function () {
		let str = _str
		_code = generateBinary(str);

	}
	_this.createBase64 = function () {
		let code = _code;
		return generatePic(code)
	}
	//todo generate code128 
	return _this;
};
function generatePic(str) {
  let barWidth=10;
	let columnCount = str.length;
	let rowCount = columnCount / 2;
	let row = str.split("");
	var gif = gifImage(barWidth * columnCount, barWidth * columnCount /2);
  for (var y = 0; y < barWidth * columnCount / 2; y += 1) {
		for (var x = 0; x < barWidth * columnCount; x += 1) {
			gif.setPixel(x, y, row[Math.floor(x / barWidth)] == '1' ? '0' : '1');
		}
	}
	var b = byteArrayOutputStream();
	gif.write(b);

	var base64 = base64EncodeOutputStream();
	var bytes = b.toByteArray();
	for (var i = 0; i < bytes.length; i += 1) {
		base64.writeByte(bytes[i]);
	}
	base64.flush();
	base64 = 'data:image/gif;base64,' + base64;

	return base64;
};
function generateBinary(str) {
	let table = 'Table ' + (/^[0-9]*$/.test(str[0]) && /^[0-9]*$/.test(str[1]) ? 'C' : 'B');
	let codeB = code128Table.find(item => {
		return item['Table C'] == 'Code B'
	})
	let codeC = code128Table.find(item => {
		return item['Table B'] == 'Code C'
	})
	let start = code128Table.find(item => {
		return item[table] == 'Start ' + (/^[0-9]*$/.test(str[0]) && /^[0-9]*$/.test(str[1]) ? 'C' : 'B')
	})

	let strResult = 0
	let current
	let codes = ''
	let i = 0
	let index = 1
	let codetype = 'C'
	let str2 = '';
	for (let i = 0; i < str.length; i++) {
		str2 += (/[0-9]/.test(str[i]) !== /[0-9]/.test(str[i + 1]) ? str[i] + '￥' : str[i])
	}
	let strArray = str2.split('￥')
	strArray = strArray.filter((str) => { return str !== '' })
	do {
		if (
			(/^[0-9]*$/.test(strArray[i]) && strArray[i].length < 6) || !(/^[0-9]*$/.test(strArray[i]))
		) //编码单位都是字母或符号或者是数字但是长度小于6
		{
			for (let j in strArray[i]) {
				current = code128Table.find(item => {
					return item['Table B'] == strArray[i][j]
				})
				let res = encodeB(strResult, table, codes, codeB, current, index);
				codes = res.codes;
				index = res.index;
				strResult = res.strResult;
				table=res.table
			}
		}
		else { //编码单位都是数字且长度大于等于6，可双位数字编码
				//奇数个对第一位特殊处理
				if (strArray[i].length % 2 !== 0) {
					//todo:第一位b编码
					current = code128Table.find(item => {
						return item['Table B'] == strArray[i][0]
					})
					let res = encodeB(strResult, table, codes, codeB, current, index);
					codes = res.codes;
					index = res.index;
					strResult = res.strResult;
					strArray[i] = strArray[i].substr(1);
				}
				for (let j = 0; j < strArray[i].length; j += 2) {
					//console.log((strArray[i][j] + strArray[i][j + 1]))
					
					current = code128Table.find(item => {
						return item['Table C'] == (strArray[i][j] + strArray[i][j + 1])
					})
					let res = encodeC(strResult, table, codes, codeC, current, index);
					codes = res.codes;
					index = res.index;
					strResult = res.strResult;
					table=res.table;
				}
			} //code c
		i++;
	} while (i < strArray.length)
	let checkDigit = (start['Valeur'] + strResult) % 103
	codes =
		start['Motif'] +
		codes +
		code128Table[checkDigit]['Motif'] +
		code128Table.find(item => {
			return item[table] == 'Stop'
		})['Motif']
	return codes;
};
function encodeB(strResult, table, codes, codeB, current, index) {
	strResult +=
		table == 'Table C'
			? ((table = 'Table B'),
				(codes += codeB['Motif'] + current['Motif']),
				(index += 2),
				codeB['Valeur'] * (index - 2) + current['Valeur'] * (index - 1))
			: (index++ ,
				(codes += current['Motif']),
				current['Valeur'] * (index - 1))
	return { codes, index, strResult ,table}
};
function encodeC(strResult, table, codes, codeC, current, index) {
	strResult +=
		table == 'Table B'
			? ((table = 'Table C'),
				(index += 2),
				(codes += codeC['Motif'] + current['Motif']),
				codeC['Valeur'] * (index - 2) + current['Valeur'] * (index - 1))
			: (index++ ,
				(codes += current['Motif']),
				current['Valeur'] * (index - 1))
	return { codes, index, strResult,table}

};

//---------------------------------------------------------------------
// gifImage (B/W)
//---------------------------------------------------------------------

var gifImage = function (width, height) {
	width=Math.floor(width);
	height=Math.floor(height)
	var _width = width;
	var _height = height;
	var _data = new Array(width * height);

	var _this = {};

	_this.setPixel = function (x, y, pixel) {
		_data[y * _width + x] = pixel;
	};

	_this.write = function (out) {

		//---------------------------------
		// GIF Signature

		out.writeString('GIF87a');

		//---------------------------------
		// Screen Descriptor

		out.writeShort(_width);
		out.writeShort(_height);

		out.writeByte(0x80); // 2bit
		out.writeByte(0);
		out.writeByte(0);

		//---------------------------------
		// Global Color Map

		// black
		out.writeByte(0x00);
		out.writeByte(0x00);
		out.writeByte(0x00);

		// white
		out.writeByte(0xff);
		out.writeByte(0xff);
		out.writeByte(0xff);

		//---------------------------------
		// Image Descriptor
		out.writeString(',');
		out.writeShort(0);
		out.writeShort(0);
		out.writeShort(_width);
		out.writeShort(_height);
		out.writeByte(0);

		//---------------------------------
		// Local Color Map

		//---------------------------------
		// Raster Data

		var lzwMinCodeSize = 2;
		var raster = getLZWRaster(lzwMinCodeSize);

		out.writeByte(lzwMinCodeSize);

		var offset = 0;

		while (raster.length - offset > 255) {
			out.writeByte(255);
			out.writeBytes(raster, offset, 255);
			offset += 255;
		}

		out.writeByte(raster.length - offset);
		out.writeBytes(raster, offset, raster.length - offset);
		out.writeByte(0x00);

		//---------------------------------
		// GIF Terminator
		out.writeString(';');
	};

	var bitOutputStream = function (out) {

		var _out = out;
		var _bitLength = 0;
		var _bitBuffer = 0;

		var _this = {};

		_this.write = function (data, length) {

			if ((data >>> length) != 0) {
				throw new Error('length over');
			}

			while (_bitLength + length >= 8) {
				_out.writeByte(0xff & ((data << _bitLength) | _bitBuffer));
				length -= (8 - _bitLength);
				data >>>= (8 - _bitLength);
				_bitBuffer = 0;
				_bitLength = 0;
			}

			_bitBuffer = (data << _bitLength) | _bitBuffer;
			_bitLength = _bitLength + length;
		};

		_this.flush = function () {
			if (_bitLength > 0) {
				_out.writeByte(_bitBuffer);
			}
		};

		return _this;
	};

	var getLZWRaster = function (lzwMinCodeSize) {

		var clearCode = 1 << lzwMinCodeSize;
		var endCode = (1 << lzwMinCodeSize) + 1;
		var bitLength = lzwMinCodeSize + 1;

		// Setup LZWTable
		var table = lzwTable();

		for (var i = 0; i < clearCode; i += 1) {
			table.add(String.fromCharCode(i));
		}
		table.add(String.fromCharCode(clearCode));
		table.add(String.fromCharCode(endCode));

		var byteOut = byteArrayOutputStream();
		var bitOut = bitOutputStream(byteOut);

		// clear code
		bitOut.write(clearCode, bitLength);

		var dataIndex = 0;

		var s = String.fromCharCode(_data[dataIndex]);
		dataIndex += 1;

		while (dataIndex < _data.length) {

			var c = String.fromCharCode(_data[dataIndex]);
			dataIndex += 1;

			if (table.contains(s + c)) {

				s = s + c;

			} else {

				bitOut.write(table.indexOf(s), bitLength);

				if (table.size() < 0xfff) {

					if (table.size() == (1 << bitLength)) {
						bitLength += 1;
					}

					table.add(s + c);
				}

				s = c;
			}
		}

		bitOut.write(table.indexOf(s), bitLength);

		// end code
		bitOut.write(endCode, bitLength);

		bitOut.flush();

		return byteOut.toByteArray();
	};

	var lzwTable = function () {

		var _map = {};
		var _size = 0;

		var _this = {};

		_this.add = function (key) {
			if (_this.contains(key)) {
				throw new Error('dup key:' + key);
			}
			_map[key] = _size;
			_size += 1;
		};

		_this.size = function () {
			return _size;
		};

		_this.indexOf = function (key) {
			return _map[key];
		};

		_this.contains = function (key) {
			return typeof _map[key] != 'undefined';
		};

		return _this;
	};

	return _this;
};
//---------------------------------------------------------------------
// byteArrayOutputStream
//---------------------------------------------------------------------

var byteArrayOutputStream = function () {

	var _bytes = new Array();

	var _this = {};

	_this.writeByte = function (b) {
		_bytes.push(b & 0xff);
	};

	_this.writeShort = function (i) {
		_this.writeByte(i);
		_this.writeByte(i >>> 8);
	};

	_this.writeBytes = function (b, off, len) {
		off = off || 0;
		len = len || b.length;
		for (var i = 0; i < len; i += 1) {
			_this.writeByte(b[i + off]);
		}
	};

	_this.writeString = function (s) {
		for (var i = 0; i < s.length; i += 1) {
			_this.writeByte(s.charCodeAt(i));
		}
	};

	_this.toByteArray = function () {
		return _bytes;
	};

	_this.toString = function () {
		var s = '';
		s += '[';
		for (var i = 0; i < _bytes.length; i += 1) {
			if (i > 0) {
				s += ',';
			}
			s += _bytes[i];
		}
		s += ']';
		return s;
	};

	return _this;
};
//---------------------------------------------------------------------
// base64EncodeOutputStream
//---------------------------------------------------------------------

var base64EncodeOutputStream = function () {

	var _buffer = 0;
	var _buflen = 0;
	var _length = 0;
	var _base64 = '';

	var _this = {};

	var writeEncoded = function (b) {
		_base64 += String.fromCharCode(encode(b & 0x3f));
	};

	var encode = function (n) {
		if (n < 0) {
			// error.
		} else if (n < 26) {
			return 0x41 + n;
		} else if (n < 52) {
			return 0x61 + (n - 26);
		} else if (n < 62) {
			return 0x30 + (n - 52);
		} else if (n == 62) {
			return 0x2b;
		} else if (n == 63) {
			return 0x2f;
		}
		throw new Error('n:' + n);
	};

	_this.writeByte = function (n) {

		_buffer = (_buffer << 8) | (n & 0xff);
		_buflen += 8;
		_length += 1;

		while (_buflen >= 6) {
			writeEncoded(_buffer >>> (_buflen - 6));
			_buflen -= 6;
		}
	};

	_this.flush = function () {

		if (_buflen > 0) {
			writeEncoded(_buffer << (6 - _buflen));
			_buffer = 0;
			_buflen = 0;
		}

		if (_length % 3 != 0) {
			// padding
			var padlen = 3 - _length % 3;
			for (var i = 0; i < padlen; i += 1) {
				_base64 += '=';
			}
		}
	};

	_this.toString = function () {
		return _base64;
	};

	return _this;
};

  
export default encode;