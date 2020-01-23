import { getInput } from '@actions/core'
import { registry } from './ecr'

/*
  Formats:
    {owner}/{repo}@{ref}
    {owner}/{repo}/{path}@{ref}
    ./path/to/dir
    docker://{image}:{tag}
    docker://{host}/{image}:{tag}
*/

const actionURL = new RegExp(/^(([^\/]+)\/([^\/@\n]+))(?:\/([^@\n]+))?(?:@(.+))?$/)
const dockerURL = new RegExp(/^(?:docker:\/\/)?(?:([^\/\n]+)\/)?([^:\n]+)(?::(.+))?$/)

// https://help.github.com/en/actions/automating-your-workflow-with-github-actions/metadata-syntax-for-github-actions

interface Input {
	description: string
	required: boolean
	default?: string
}

type Inputs = { [key: string]: Input }

interface Output {
	description: string
}
type Outputs = { [key: string]: Output }

enum BrandingColor {
	White = 'white',
	Yellow = 'yellow',
	Blue = 'blue',
	Green = 'green',
	Orange = 'orange',
	Red = 'red',
	Purple = 'purple',
	DarkGray = 'gray-dark',
}

enum BrandingIcon {
	Activity = 'activity',
	Airplay = 'airplay',
	AlertCircle = 'alert-circle',
	AlertOctagon = 'alert-octagon',
	AlertTriangle = 'alert-triangle',
	AlignCenter = 'align-center',
	AlignJustify = 'align-justify',
	AlignLeft = 'align-left',
	AlignRight = 'align-right',
	Anchor = 'anchor',
	Aperture = 'aperture',
	Archive = 'archive',
	ArrowDownCircle = 'arrow-down-circle',
	ArrowDownLeft = 'arrow-down-left',
	ArrowDownRight = 'arrow-down-right',
	ArrowDown = 'arrow-down',
	ArrowLeftCircle = 'arrow-left-circle',
	ArrowLeft = 'arrow-left',
	ArrowRightCircle = 'arrow-right-circle',
	ArrowRight = 'arrow-right',
	ArrowUpCircle = 'arrow-up-circle',
	ArrowUpLeft = 'arrow-up-left',
	ArrowUpRight = 'arrow-up-right',
	ArrowUp = 'arrow-up',
	AtSign = 'at-sign',
	Award = 'award',
	BarChart2 = 'bar-chart-2',
	BarChart = 'bar-chart',
	BatteryCharging = 'battery-charging',
	Battery = 'battery',
	BellOff = 'bell-off',
	Bell = 'bell',
	Bluetooth = 'bluetooth',
	Bold = 'bold',
	BookOpen = 'book-open',
	Book = 'book',
	Bookmark = 'bookmark',
	Box = 'box',
	Briefcase = 'briefcase',
	Calendar = 'calendar',
	CameraOff = 'camera-off',
	Camera = 'camera',
	Cast = 'cast',
	CheckCircle = 'check-circle',
	CheckSquare = 'check-square',
	Check = 'check',
	ChevronDown = 'chevron-down',
	ChevronLeft = 'chevron-left',
	ChevronRight = 'chevron-right',
	ChevronUp = 'chevron-up',
	ChevronsDown = 'chevrons-down',
	ChevronsLeft = 'chevrons-left',
	ChevronsRight = 'chevrons-right',
	ChevronsUp = 'chevrons-up',
	Circle = 'circle',
	Clipboard = 'clipboard',
	Clock = 'clock',
	CloudDrizzle = 'cloud-drizzle',
	CloudLightning = 'cloud-lightning',
	CloudOff = 'cloud-off',
	CloudRain = 'cloud-rain',
	CloudSnow = 'cloud-snow',
	Cloud = 'cloud',
	Code = 'code',
	Command = 'command',
	Compass = 'compass',
	Copy = 'copy',
	CornerDownLeft = 'corner-down-left',
	CornerDownRight = 'corner-down-right',
	CornerLeftDown = 'corner-left-down',
	CornerLeftUp = 'corner-left-up',
	CornerRightDown = 'corner-right-down',
	CornerRightUp = 'corner-right-up',
	CornerUpLeft = 'corner-up-left',
	CornerUpRight = 'corner-up-right',
	CPU = 'cpu',
	CreditCard = 'credit-card',
	Crop = 'crop',
	Crosshair = 'crosshair',
	Database = 'database',
	Delete = 'delete',
	Disc = 'disc',
	DollarSign = 'dollar-sign',
	DownloadCloud = 'download-cloud',
	Download = 'download',
	Droplet = 'droplet',
	Edit2 = 'edit-2',
	Edit3 = 'edit-3',
	Edit = 'edit',
	ExternalLink = 'external-link',
	EyeOff = 'eye-off',
	Eye = 'eye',
	Facebook = 'facebook',
	FastForward = 'fast-forward',
	Feather = 'feather',
	FileMinus = 'file-minus',
	FilePlus = 'file-plus',
	FileText = 'file-text',
	File = 'file',
	Film = 'film',
	Filter = 'filter',
	Flag = 'flag',
	FolderMinus = 'folder-minus',
	FolderPlus = 'folder-plus',
	Folder = 'folder',
	Gift = 'gift',
	GitBranch = 'git-branch',
	GitCommit = 'git-commit',
	GitMerge = 'git-merge',
	GitPullRequest = 'git-pull-request',
	Globe = 'globe',
	Grid = 'grid',
	HardDrive = 'hard-drive',
	Hash = 'hash',
	Headphones = 'headphones',
	Heart = 'heart',
	HelpCircle = 'help-circle',
	Home = 'home',
	Image = 'image',
	Inbox = 'inbox',
	Info = 'info',
	Italic = 'italic',
	Layers = 'layers',
	Layout = 'layout',
	LifeBuoy = 'life-buoy',
	Link2 = 'link-2',
	Link = 'link',
	List = 'list',
	Loader = 'loader',
	Lock = 'lock',
	Login = 'log-in',
	Logout = 'log-out',
	Mail = 'mail',
	MapPin = 'map-pin',
	Map = 'map',
	Maximize2 = 'maximize-2',
	Maximize = 'maximize',
	Menu = 'menu',
	MessageCircle = 'message-circle',
	MessageSquare = 'message-square',
	MicOff = 'mic-off',
	Mic = 'mic',
	Minimize2 = 'minimize-2',
	Minimize = 'minimize',
	MinusCircle = 'minus-circle',
	MinusSquare = 'minus-square',
	Minus = 'minus',
	Monitor = 'monitor',
	Moon = 'moon',
	MoreHorizontal = 'more-horizontal',
	MoreVertical = 'more-vertical',
	Move = 'move',
	Music = 'music',
	Navigation2 = 'navigation-2',
	Navigation = 'navigation',
	Octagon = 'octagon',
	Package = 'package',
	Paperclip = 'paperclip',
	PauseCircle = 'pause-circle',
	Pause = 'pause',
	Percent = 'percent',
	PhoneCall = 'phone-call',
	PhoneForwarded = 'phone-forwarded',
	PhoneIncoming = 'phone-incoming',
	PhoneMissed = 'phone-missed',
	PhoneOff = 'phone-off',
	PhoneOutgoing = 'phone-outgoing',
	Phone = 'phone',
	PieChart = 'pie-chart',
	PlayCircle = 'play-circle',
	Play = 'play',
	PlusCircle = 'plus-circle',
	PlusSquare = 'plus-square',
	Plus = 'plus',
	Pocket = 'pocket',
	Power = 'power',
	Printer = 'printer',
	Radio = 'radio',
	RefreshCCW = 'refresh-ccw',
	RefreshCW = 'refresh-cw',
	Repeat = 'repeat',
	Rewind = 'rewind',
	RotateCCW = 'rotate-ccw',
	RotateCW = 'rotate-cw',
	RSS = 'rss',
	Save = 'save',
	Scissors = 'scissors',
	Search = 'search',
	Send = 'send',
	Server = 'server',
	Settings = 'settings',
	Share2 = 'share-2',
	Share = 'share',
	ShieldOff = 'shield-off',
	Shield = 'shield',
	ShoppingBag = 'shopping-bag',
	ShoppingCart = 'shopping-cart',
	Shuffle = 'shuffle',
	Sidebar = 'sidebar',
	SkipBack = 'skip-back',
	SkipForward = 'skip-forward',
	Slash = 'slash',
	Sliders = 'sliders',
	Smartphone = 'smartphone',
	Speaker = 'speaker',
	Square = 'square',
	Star = 'star',
	StopCircle = 'stop-circle',
	Sun = 'sun',
	Sunrise = 'sunrise',
	Sunset = 'sunset',
	Tablet = 'tablet',
	Tag = 'tag',
	Target = 'target',
	Terminal = 'terminal',
	Therometer = 'thermometer',
	ThumbsDown = 'thumbs-down',
	ThumbsUp = 'thumbs-up',
	ToggleLeft = 'toggle-left',
	ToggleRight = 'toggle-right',
	Trash2 = 'trash-2',
	Trash = 'trash',
	TrendingDown = 'trending-down',
	TrendingUp = 'trending-up',
	Triangle = 'triangle',
	Truck = 'truck',
	TV = 'tv',
	Type = 'type',
	Umbrella = 'umbrella',
	Underline = 'underline',
	Unlock = 'unlock',
	UploadCloud = 'upload-cloud',
	Upload = 'upload',
	UserCheck = 'user-check',
	UserMinus = 'user-minus',
	UserPlus = 'user-plus',
	UserX = 'user-x',
	User = 'user',
	Users = 'users',
	VideoOff = 'video-off',
	Video = 'video',
	Voicemail = 'voicemail',
	Volume1 = 'volume-1',
	Volume2 = 'volume-2',
	VolumeX = 'volume-x',
	Volume = 'volume',
	Watch = 'watch',
	WifiOff = 'wifi-off',
	Wifi = 'wifi',
	Wind = 'wind',
	XCircle = 'x-circle',
	XSquare = 'x-square',
	X = 'x',
	ZapOff = 'zap-off',
	Zap = 'zap',
	ZoomIn = 'zoom-in',
	ZoomOut = 'zoom-out',
}

enum PostIf {
	Always = 'always()',
	Cancelled = 'cancelled()',
	Failure = 'failure()',
	Success = 'success()',
}

enum Using {
	Node = 'node12',
	Docker = 'docker',
}

export type Env = { [key: string]: string }

export interface ContainerRuns {
	using: Using.Docker
	image: string

	args?: Array<string>
	entrypoint?: string
	env?: Env
	'post-entrypoint'?: string
	'post-if'?: PostIf
}

export interface NodeRuns {
	using: Using.Node
	main: string

	post?: string
	'post-if'?: PostIf
}

export interface IAction {
	name: string
	author?: string
	description: string
	inputs?: Inputs
	outputs?: Outputs
	runs: ContainerRuns | NodeRuns
	icon?: BrandingIcon
	color?: BrandingColor
	url: DockerURL | NodeURL
}

export interface DockerURL {
	registry?: string
	image?: string
	tag?: string
}

export interface NodeURL {
	action: string
	owner: string
	repo: string
	path?: string
	ref?: string
}

export class Action implements IAction {
	name: string
	author?: string
	description: string
	inputs?: Inputs
	outputs?: Outputs
	runs: ContainerRuns | NodeRuns
	url: DockerURL | NodeURL

	constructor(input: IAction) {
		this.name = input.name
		if (input.author && input.author.length) {
			this.author = input.author
		}
		this.description = input.description
		if (input.inputs && input.inputs.length) {
			this.inputs = input.inputs
		}
		if (input.outputs && input.outputs.length) {
			this.outputs = input.outputs
		}

		const using = input.runs.using

		if (using === Using.Docker) {
			this.runs = input.runs as ContainerRuns
			const parts = dockerURL.exec(this.runs.image)!
			if (parts.length !== 4) {
				throw new Error('Action must be in the following format: [{registry}/]{image}[:{tag}]')
			}

			this.url = {
				registry: parts[1],
				image: parts[2],
				tag: parts[3],
			}
		} else if (using === Using.Node) {
			this.runs = input.runs as NodeRuns

			if (this.runs.main.startsWith('.')) throw new Error('Does not support local prefixed actions')

			const parts = actionURL.exec(this.runs.main)!
			if (parts.length !== 6)
				throw new Error('Action must be in the following format: {owner}/{repo}[/{path}][@{ref}]')

			this.url = {
				action: parts[1],
				owner: parts[2],
				repo: parts[3],
				path: parts[4],
				ref: parts[5],
			}
		} else {
			throw new Error(`Unknown Execution Engine: ${using}`)
		}
	}

	isDocker = (): boolean => this.runs.using === Using.Docker
	isNode = (): boolean => this.runs.using === Using.Node

	env(): Env | undefined {
		if (!this.inputs) return

		let env: Env = {}

		Object.keys(this.inputs).forEach(input => {
			const name = `INPUT_${input.toUpperCase()}`

			const val = getInput(input, { required: this.inputs![input].required }) || this.inputs![input].default

			if (val && val.length) env[name] = val
		})

		return env
	}

	dockerImage = async (): Promise<string> => {
		const url = this.url as DockerURL
		const r: Promise<string | undefined> = url.registry === 'ECR' ? registry() : Promise.resolve(url.registry)
		return r.then(r => formatDockerImagePath(r!, url))
	}
}

function formatDockerImagePath(registry: string, url: DockerURL): string {
	let dockerImagePath: string = url.image!

	if (registry) {
		dockerImagePath = `${registry}/${dockerImagePath}`
	}

	if (url.tag) {
		dockerImagePath += `:${url.tag}`
	}

	return dockerImagePath
}

export class Target {
	clone: boolean
	url: DockerURL | NodeURL

	constructor(url: DockerURL | NodeURL, clone = true) {
		this.clone = clone
		this.url = url
	}

	dockerImage = async (): Promise<string> => {
		const url = this.url as DockerURL
		const r: Promise<string | undefined> = url.registry === 'ECR' ? registry() : Promise.resolve(url.registry)
		return r.then(r => formatDockerImagePath(r!, url))
	}
}

export function target(): Promise<Target> {
	const action = getInput('target-action', { required: true })

	if (action.startsWith('.')) {
		return Promise.reject(new Error('Does not support local prefixed actions'))
	}

	if (action.startsWith('docker://')) {
		const parts = dockerURL.exec(action)!
		if (parts.length !== 4) {
			throw new Error('Action must be in the following format: [{registry}/]{image}[:{tag}]')
		}

		return Promise.resolve(
			new Target(
				{
					registry: parts[1],
					image: parts[2],
					tag: parts[3],
				},
				false
			)
		)
	}

	const parts = actionURL.exec(action)!
	if (parts.length !== 6) {
		return Promise.reject(new Error('Action must be in the following format: {owner}/{repo}[/{path}][@{ref}]'))
	}

	return Promise.resolve(
		new Target({
			action: parts[1],
			owner: parts[2],
			repo: parts[3],
			path: parts[4],
			ref: parts[5],
		})
	)
}
