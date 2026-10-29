O=tarot/ads; mkdir -p $O
B=https://cdtfglylekiyxdmrgbne.supabase.co/storage/v1/object/public/wa-midia/tarot/ads
{
for f in ad_img1_hd.jpg ad_img2_hd.jpg ad_video_hd.mp4 ct2_img1_mesa.png ct2_img2_lua.png ct2_img3_linho.png ct2_img4_copas.jpg ct2_video.mp4 ciclo_lua_oferta_v3.png; do
  curl -sSL -o $O/$f -w "$f %{http_code} %{size_download}\n" $B/$f
done
# thumbs leves (jpg 720px) e poster dos videos
for f in ad_img1_hd.jpg ad_img2_hd.jpg ct2_img1_mesa.png ct2_img2_lua.png ct2_img3_linho.png ct2_img4_copas.jpg ciclo_lua_oferta_v3.png; do
  ffmpeg -nostdin -loglevel error -y -i $O/$f -vf "scale=720:-2" -q:v 4 $O/th_${f%.*}.jpg
done
for v in ad_video_hd ct2_video; do
  ffmpeg -nostdin -loglevel error -y -ss 1 -i $O/$v.mp4 -frames:v 1 -vf "scale=720:-2" -q:v 4 $O/th_$v.jpg
  ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 $O/$v.mp4
done
ls -la $O
} > $O/job.log 2>&1
exit 0
