import {exec as stdexec} from 'child_process'
import {promisify} from 'util'

export const exec = promisify(stdexec)
