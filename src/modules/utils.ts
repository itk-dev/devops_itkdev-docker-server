'use strict';

import * as fs from "fs"
import * as path from "path"

export default class Utils {

  /**
   * Is the source a directory.
   *
   * @param source
   * @returns {boolean}
   */
  public isDirectory (source: string) {
    return fs.lstatSync(source).isDirectory();
  }

  /**
   * Is source a file.
   *
   * @param source
   * @returns {boolean}
   */
  public isFile (source: string) {
    try {
      if (fs.existsSync(source)) {
        return fs.lstatSync(source).isFile() || fs.lstatSync(source).isSymbolicLink();
      }
    } catch(err) {
      return false
    }

    return false;
  }

  /**
   * Get all directories at source.
   *
   * @param source
   * @returns {string[]}
   */
  public getDirectories (source: string) {
    return fs.readdirSync(source).map((name: string) => path.join(source, name)).filter(this.isDirectory);
  }

  /**
   * Get all files at source.
   *
   * @param source
   * @returns {string[]}
   */
  public getFiles (source: string) {
    return fs.readdirSync(source).map((name: string) => path.join(source, name)).filter(this.isFile);
  }

  /**
   * Escape shell argument.
   *
   * @see https://github.com/nodejs/node/issues/34840#issuecomment-677402567
   *
   * @param value
   */
  public shellEscape(s: string) {
    if (s === '') return `''`;
    if (!/[^%+,-.\/:=@_0-9A-Za-z]/.test(s)) return s;
    return `'` + s.replace(/'/g, `'"'`) + `'`;
  }
}
