// Filesystem for reading ini files
import { readFileSync, accessSync, watch as watchFs } from "fs";
import { resolve } from "path";
// Configuration shema
import { Config, LOGTAG } from "../models/Config";
import { EventEmitter } from "events";

/**
 * 
 *
 * @export
 * @class ConfigLoader
 * @extends {EventEmitter}
 * @template T
 */
export class ConfigLoader<T extends Config> extends EventEmitter {
	protected static highlander: ConfigLoader<any> = null;

	/**
	 * get Instance of ConfigLoader
	 *
	 * @static
	 * @template TC
	 * @param {string} [configRoot]
	 * @returns {ConfigLoader<TC>}
	 * @memberof ConfigLoader
	 */
	public static getInstance<TC extends Config>(configRoot?: string): ConfigLoader<TC> {
		if (!ConfigLoader.highlander && configRoot) {
			ConfigLoader.highlander = new ConfigLoader<TC>(configRoot);
		}
		return ConfigLoader.highlander;
	}

	public cfg: T = null;

	/**
	 * Creates an instance of ConfigLoader.
	 * @param {string} configRoot
	 * @memberof ConfigLoader
	 */
	private constructor(private configRoot: string) {
		super();
		const pathJSON = resolve(this.configRoot, "config.default.json");

		try {
			accessSync(pathJSON);
			this.useJSON();
		} catch (error) {
			console.log(LOGTAG.ERROR,'[ConfigLoader]',error);
			throw "Unable to initialize config";
		}
	}

	/**
	 * using json files for config
	 *
	 * @private
	 * @memberof ConfigLoader
	 */
	private useJSON(): void {
		const pathJSON = resolve(this.configRoot, "config.json");
		let content = null;
		try {
			accessSync(pathJSON);
			content = readFileSync(pathJSON).toString();
		} catch (error) {
			content = readFileSync(resolve(this.configRoot, "config.default.json")).toString();
		}

		try {
			this.cfg = JSON.parse(content);
		} catch (error) {
			throw error;
		}

		watchFs(this.configRoot, (e: string, f: string) => {
			if (f == "config.json") {
				// delay to prevent Unexpected end of JSON input error
				setTimeout(() => {
					try {
						let cFile = resolve(this.configRoot, f);
						let cString = readFileSync(cFile).toString();
						let ConfigChange = JSON.parse(cString);

						Object.assign(this.cfg, ConfigChange);
						this.emit("update", this.cfg);
					} catch (error) {
						console.log(LOGTAG.ERROR, "[ConfigLoader]", error);
					}
				}, 1000);
			}
		});

	}

}





