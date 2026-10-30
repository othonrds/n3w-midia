O=fotosadv/2026-10-29-gerando/gerado; mkdir -p $O
U=https://d8j0ntlcm91z4.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u
{
i=1; for f in hf_20261030_021456_d5ce821d-8a5f-4893-935a-afdd12b0c9c1 hf_20261030_021456_7443644e-53d4-432d-a087-9cb484b110fa hf_20261030_021457_595ced32-24fd-433a-8dde-d94dfa2b2ca5 hf_20261030_021457_d039dd4e-d564-43b2-9a1b-aaf06e2b602a hf_20261030_021457_c92e138b-8221-434a-915c-f6333ef02772 hf_20261030_021456_cc9c81ed-f036-404f-9369-0746e23fb3d0 hf_20261030_021457_5476f3f2-3398-4d6e-81b1-7475518ef23f hf_20261030_021457_2197e53f-cffc-41b8-9e4e-93d771a9f49e; do
  curl -sSL -o $O/e$i.png -w "e$i %{http_code} %{size_download}\n" $U/$f.png; i=$((i+1)); done
curl -sSL -o $O/voz_andre.mp3 -w "voz %{http_code} %{size_download}\n" $U/hf_20261030_021546_407f53fc-8b10-4347-9e4f-46e1e2175397.mp3
for i in 1 2 3 4 5 6 7 8; do ffmpeg -nostdin -loglevel error -y -i $O/e$i.png -q:v 2 $O/e$i.jpg && rm $O/e$i.png; done
ffprobe -v error -show_entries format=duration -of csv=p=0 $O/voz_andre.mp3
ls -la $O
} > $O/job.log 2>&1
exit 0
