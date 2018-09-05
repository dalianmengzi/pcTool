-- Start of the configuration. This is the only node in the config file. 
-- The rest of them are sub-nodes
configuration=
{
	-- if true, the server will run as a daemon.
	-- NOTE: all console appenders will be ignored if this is a daemon
	daemon=false,
	-- the OS's path separator. Used in composing paths
	pathSeparator="/",

	-- this is the place where all the logging facilities are setted up
	-- you can add/remove any number of locations

	logAppenders=
	{
		{
			-- name of the appender. Not too important, but is mandatory
			name="console appender",
			-- type of the appender. We can have the following values:
			-- console, coloredConsole and file
			-- NOTE: console appenders will be ignored if we run the server
			-- as a daemon
			type="coloredConsole",
			-- the level of logging. 6 is the FINEST message, 0 is FATAL message.
			-- The appender will "catch" all the messages below or equal to this level
			-- bigger the level, more messages are recorded
			level=6
		},
		{
			name="file appender",
			type="file",
			level=6,
			-- the file where the log messages are going to land
			fileName="./tmp/crtmpserver",
			--newLineCharacters="\r\n",
			fileHistorySize=10,
			fileLength=1024*256,
			singleLine=true
		}
	},
	
	-- this node holds all the RTMP applications
	applications=
	{
		-- this is the root directory of all applications
		-- usually this is relative to the binary execuable
		rootDirectory="applications",
		
		
		--this is where the applications array starts
		{
			-- The name of the application. It is mandatory and must be unique 
			name="appselector",
			-- Short description of the application. Optional
			description="Application for selecting the rest of the applications",
			
			-- The type of the application. Possible values are:
			-- dynamiclinklibrary - the application is a shared library
			protocol="dynamiclinklibrary",
			-- the complete path to the library. This is optional. If not provided, 
			-- the server will try to load the library from here
			-- <rootDirectory>/<name>/lib<name>.{so|dll|dylib}
			-- library="/some/path/to/some/shared/library.so"
			
			-- Tells the server to validate the clien's handshake before going further. 
			-- It is optional, defaulted to true
			validateHandshake=false,
			-- this is the folder from where the current application gets it's content.
			-- It is optional. If not specified, it will be defaulted to:
			-- <rootDirectory>/<name>/mediaFolder
			-- mediaFolder="/some/directory/where/media/files/are/stored"
			-- the application will also be known by that names. It is optional
			--aliases=
			--{
			--	"simpleLive",
			--	"vod",
			--	"live",
			--},
			-- This flag designates the default application. The default application
			-- is responsable of analyzing the "connect" request and distribute 
			-- the future connection to the correct application.
			default=true,
			acceptors = 
			{
				{
					ip="0.0.0.0",
					port=1935,
					protocol="inboundRtmp"
				},
				--[[{
					ip="0.0.0.0",
					port=8081,
					protocol="inboundRtmps",
					sslKey="server.key",
					sslCert="server.crt"
				},
				{
					ip="0.0.0.0",
					port=8080,
					protocol="inboundRtmpt"
				},]]--
			}
		},
		{
			description="meetone.1.0",
			name="meetone",
			protocol="dynamiclinklibrary",
			aliases=
			{
				"meetone.1.0",
				"encoder",
				"live",
			},
			acceptors = 
			{
				{
					ip="0.0.0.0",
					port=1935,
					protocol="inboundLiveFlv",
					waitForMetadata=true
				},
			},
			mediaStorage = {
			  recordedstreamsstorage="./Volumes/Storage/media/record/",
				storageRecord={
					mediaFolder="./Volumes/Storage/media/record/",
					metaFolder="./tmp/metadata",
				},
			},
		},
        {
              name="proxypublish",
              description="Application for forwarding streams to another RTMP server",
              protocol="dynamiclinklibrary",
              acceptors =
              {
                {
                  ip="0.0.0.0",
                  port=6665,                             -- 主服务器接收RTMP流的端口
                  protocol="inboundRtmp"
                },
				{
					ip="0.0.0.0",
					port=6666,
					protocol="httpEchoProtocol"
				},
              },
              abortOnConnectError=true,
              targetServers =
              {
                {
                  targetUri="rtmp://192.168.40.161:2935/encoder/",   -- 从服务器的URL
                  targetStreamType="live", -- (live, record or append)
                  --localStreamName="video",            -- 推送到从服务器的流
				  streamKey="deskshare",
				  noPublishStream=true,
                  keepAlive=true
                },
              },
			  validateHandshake=false,
            },
		--[[{
			name="samplefactory",
			description="asdsadasdsa",
			protocol="dynamiclinklibrary",
			aliases=
			{
				"httpOutboundTest"
			},
			acceptors = 
			{
				{
					ip="0.0.0.0",
					port=8989,
					protocol="httpEchoProtocol"
				},
				{
					ip="0.0.0.0",
					port=8988,
					protocol="echoProtocol"
				}
			},
			validateHandshake=false,
			--default=true,
		},
		{
			name="vptests",
			description="Variant protocol tests",
			protocol="dynamiclinklibrary",
			aliases=
			{
				"vptests_alias1",
				"vptests_alias2",
				"vptests_alias3",
			},
			acceptors = 
			{
				{
					ip="0.0.0.0",
					port=1111,
					protocol="inboundHttpXmlVariant"
				}
			},
			validateHandshake=false,
			--default=true,
		},]]--
		--[[{
			name="admin",
			description="Application for administering",
			protocol="dynamiclinklibrary",
			aliases=
			{
				"admin_alias1",
				"admin_alias2",
				"admin_alias3",
			},
			acceptors = 
			{
				{
					ip="0.0.0.0",
					port=1112,
					protocol="inboundJsonCli",
					useLengthPadding=true
				},
			},
			validateHandshake=false,
			--default=true,
		},
		{
			name="vmapp",
			description="An application demonstrating the use of virtual machines",
			protocol="dynamiclinklibrary",
			vmType="lua",
			script="flvplayback.lua",
			aliases=
			{
				"flvplayback1",
				"vod1"
			},
			acceptors=
			{
				{
					ip="0.0.0.0",
					port=6544,
					protocol="inboundTcpTs"
				}
			}
		},]]--
		--#INSERTION_MARKER# DO NOT REMOVE THIS. USED BY appscaffold SCRIPT.
	}
}

