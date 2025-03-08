import Image from "next/image"

const Brand = ({ ...props }) => (
    <Image
        src="/BusBeacon.svg"
        alt="Bus Beacon logo"
        {...props}
        width={40}
        height={40}
        priority
    />
)
export default Brand